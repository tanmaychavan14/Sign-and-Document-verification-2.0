from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
import os
import shutil
import cv2
import numpy as np
from tensorflow.keras.models import load_model
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load the pre-trained model
try:
    model = load_model('models/signature_model.h5')
    logger.info("Model loaded successfully")
except Exception as e:
    logger.error(f"Failed to load model: {e}")
    # Initialize a dummy model for development if needed
    # In production, this should raise an exception

# Create a temporary directory for uploaded images
temp_dir = "temp_signatures"
os.makedirs(temp_dir, exist_ok=True)

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "FastAPI signature verification service is running"}

def verify_signature(original_signature_path, verification_signature_path):
    try:
        # Load and preprocess the original signature
        original_signature = cv2.imread(original_signature_path, cv2.IMREAD_COLOR)
        if original_signature is None:
            raise ValueError(f"Failed to load image from {original_signature_path}")
        original_signature = cv2.resize(original_signature, (100, 100)).astype('float32') / 255.0
        logger.info(f"Original signature shape: {original_signature.shape}")

        # Load and preprocess the verification signature
        verification_signature = cv2.imread(verification_signature_path, cv2.IMREAD_COLOR)
        if verification_signature is None:
            raise ValueError(f"Failed to load image from {verification_signature_path}")
        verification_signature = cv2.resize(verification_signature, (100, 100)).astype('float32') / 255.0
        logger.info(f"Verification signature shape: {verification_signature.shape}")

        # Add batch dimension
        original_signature = np.expand_dims(original_signature, axis=0)
        verification_signature = np.expand_dims(verification_signature, axis=0)

        # Predict using the model for original vs verification
        prediction_original_vs_verification = model.predict([original_signature, verification_signature])
        prediction_verification_vs_original = model.predict([verification_signature, original_signature])
        
        logger.info(f"Prediction scores: {prediction_original_vs_verification[0][0]}, {prediction_verification_vs_original[0][0]}")

        # Calculate similarity score (inverse of the average dissimilarity)
        similarity_score = 1.0 - ((prediction_original_vs_verification[0][0] + prediction_verification_vs_original[0][0]) / 2.0)
        
        # Determine the result based on the predictions (threshold at 0.5)
        result = "Genuine" if similarity_score > 0.85 else "Forged"
        
        return {
            "result": result,
            "similarity_score": float(similarity_score)
        }
    except Exception as e:
        logger.error(f"Error in verification: {e}")
        raise e

@app.post("/verify-signature/")
async def verify_signature_endpoint(original_signature: UploadFile = File(...), verification_signature: UploadFile = File(...)):
    try:
        logger.info(f"Received signature verification request: {original_signature.filename}, {verification_signature.filename}")
        
        # Define dynamic file paths for uploaded files
        original_path = os.path.join(temp_dir, original_signature.filename)
        verification_path = os.path.join(temp_dir, verification_signature.filename)

        # Save the uploaded original signature to disk
        with open(original_path, "wb") as f:
            shutil.copyfileobj(original_signature.file, f)
        logger.info(f"Saved original signature to {original_path}")

        # Save the uploaded verification signature to disk
        with open(verification_path, "wb") as f:
            shutil.copyfileobj(verification_signature.file, f)
        logger.info(f"Saved verification signature to {verification_path}")

        # Call the signature verification function
        result = verify_signature(original_path, verification_path)
        logger.info(f"Verification result: {result}")

        # Cleanup temporary files
        os.remove(original_path)
        os.remove(verification_path)

        # Return the result as a JSON response
        return JSONResponse(content=result)
    except Exception as e:
        logger.error(f"Error processing request: {e}")
        return HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)