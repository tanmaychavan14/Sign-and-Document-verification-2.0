from fastapi import FastAPI, File, UploadFile, HTTPException, Depends
from fastapi.responses import JSONResponse
import os
import shutil
import cv2
import numpy as np
import logging
import pytesseract
import json
import google.generativeai as genai
from tensorflow.keras.models import load_model

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configure Tesseract
pytesseract.pytesseract.tesseract_cmd = "/usr/bin/tesseract"

# Configure Gemini API (use environment variable in production)
genai.configure(api_key="AIzaSyAdxiIs1UrzyMogREnWS0mH5vSe8HashPs")

# Create a temporary directory for uploaded files
temp_dir = "temp_files"
os.makedirs(temp_dir, exist_ok=True)

# Load the pre-trained model for signature verification
try:
    model = load_model('models/signature_model.h5')
    logger.info("Signature model loaded successfully")
except Exception as e:
    logger.error(f"Failed to load signature model: {e}")

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "FastAPI verification service is running"}

# Existing signature verification function
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

# New document verification function
def extract_document_text(image_path, lang='eng', preprocess=False):
    """
    Extract all text from a document image using OCR.
    """
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image file not found: {image_path}")
    
    image = cv2.imread(image_path)
    if image is None:
        raise ValueError("Unable to load the image. Please check the file format and path.")
    
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    if preprocess:
        gray = cv2.GaussianBlur(gray, (5, 5), 0)
        _, gray = cv2.threshold(gray, 128, 255, cv2.THRESH_BINARY)
    
    custom_config = r'--oem 3 --psm 6'
    full_text = pytesseract.image_to_string(gray, lang=lang, config=custom_config).strip()
    
    return full_text

def analyze_document_text(text):
    """
    Send extracted text to the Gemini API for processing.
    """
    try:
        model = genai.GenerativeModel("gemini-2.0-flash-exp")
        
        prompt = (
            "Analyze the extracted text and determine the type of document it was taken from "
            "(e.g., invoice, marksheet, medical report, etc.). "
            "Then, format the extracted data into a structured JSON with meaningful key-value pairs."
            " Ensure the JSON is well-structured and follows common naming conventions."
            "\n\nExtracted Text:\n" + text
        )
        
        response = model.generate_content(prompt)
        
        return response.text if response else "No response from Gemini."
    except Exception as e:
        logger.error(f"Error analyzing document text: {e}")
        return f"Error: {str(e)}"

def verify_documents(original_doc_path, verification_doc_path):
    """
    Compare the content of two documents and calculate a similarity score.
    """
    try:
        # Extract text from both documents
        original_text = extract_document_text(original_doc_path)
        verification_text = extract_document_text(verification_doc_path)
        
        logger.info(f"Original document text length: {len(original_text)}")
        logger.info(f"Verification document text length: {len(verification_text)}")
        
        # Analyze the document content
        original_analysis = analyze_document_text(original_text)
        
        # Try to parse as JSON, if not possible, use raw text
        try:
            original_structured = json.loads(original_analysis)
            document_type = original_structured.get("documentType", "Unknown")
        except json.JSONDecodeError:
            original_structured = {"rawText": original_text}
            document_type = "Unknown"
        
        # Simple text matching for verification
        # In a production system, you would implement more sophisticated comparison
        # that takes into account document structure, key fields, etc.
        
        # Calculate a simple similarity score
        original_tokens = set(original_text.lower().split())
        verification_tokens = set(verification_text.lower().split())
        
        common_tokens = original_tokens.intersection(verification_tokens)
        all_tokens = original_tokens.union(verification_tokens)
        
        similarity_score = len(common_tokens) / len(all_tokens) if all_tokens else 0
        
        # Determine if documents match (threshold can be adjusted)
        is_match = similarity_score > 0.80
        result = "Genuine" if is_match else "Forged"
        
        return {
            "result": result,
            "document_type": document_type,
            "similarity_score": float(similarity_score),
            "extracted_text": original_text,
            "structured_data": original_structured
        }
    except Exception as e:
        logger.error(f"Error in document verification: {e}")
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

@app.post("/verify-document/")
async def verify_document_endpoint(original_document: UploadFile = File(...), verification_document: UploadFile = File(...)):
    try:
        logger.info(f"Received document verification request: {original_document.filename}, {verification_document.filename}")
        
        # Define dynamic file paths for uploaded files
        original_path = os.path.join(temp_dir, original_document.filename)
        verification_path = os.path.join(temp_dir, verification_document.filename)

        # Save the uploaded original document to disk
        with open(original_path, "wb") as f:
            shutil.copyfileobj(original_document.file, f)
        logger.info(f"Saved original document to {original_path}")

        # Save the uploaded verification document to disk
        with open(verification_path, "wb") as f:
            shutil.copyfileobj(verification_document.file, f)
        logger.info(f"Saved verification document to {verification_path}")

        # Call the document verification function
        result = verify_documents(original_path, verification_path)
        logger.info(f"Document verification result: {result}")

        # Cleanup temporary files
        os.remove(original_path)
        os.remove(verification_path)

        # Return the result as a JSON response
        return JSONResponse(content=result)
    except Exception as e:
        logger.error(f"Error processing document verification request: {e}")
        return HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)