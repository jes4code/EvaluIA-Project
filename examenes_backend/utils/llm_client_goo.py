import os
import json
import re
import google.generativeai as genai
import base64
import time
from typing import Optional, Dict, List
from google.generativeai import types


GOOGLE_API_KEY = os.getenv("GEMINI_API_KEY")
if not GOOGLE_API_KEY:
    raise RuntimeError("Falta GEMINI_API_KEY en variables de entorno")

genai.configure(api_key=GOOGLE_API_KEY)

MODEL_NAME = 'gemini-2.5-flash'
REQUEST_DELAY = 2  
MAX_RETRIES = 3    

def extract_json(text: str) -> Optional[str]:
    if not text:
        return None

    m = re.search(r"```json\s*(.*?)\s*```", text, re.DOTALL | re.IGNORECASE)
    if m:
        return m.group(1)

    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        return text[start:end+1]

    start = text.find("[")
    end = text.rfind("]")
    if start != -1 and end != -1 and end > start:
        return text[start:end+1]

    return None


def clean_json_string(json_str: str) -> str:
    if not isinstance(json_str, str):
        raise ValueError("JSON extraído vacío o no es string (probablemente truncado).")
    return re.sub(r'(?<!\\)[\n\r\t]', ' ', json_str)

def build_response(pdf_file: str, correccion_data: dict) -> dict:
    """
    Construye la respuesta del backend con metadatos y la corrección completa.

    :param pdf_file: nombre del archivo PDF corregido.
    :param correccion_data: diccionario con keys "correccion" (lista), 
                            "comentario_general" (str) y "nombre_alumno" (str).
    :param examen_id: id del examen (opcional).
    :return: diccionario con metadatos y corrección.
    """

    return {
        "metadata": {
            "pdf_file": pdf_file,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        },
        "correccion": correccion_data.get("correccion", []),
        "comentario_general": correccion_data.get("comentario_general", ""),
        "nombre_alumno": correccion_data.get("nombre_alumno", ""),
        "nota_asignada": correccion_data.get("nota_asignada", 0),
        "nota_max": correccion_data.get("nota_max", 0)
    }


def enviar_imagen(
    prompt: str,
    pdf_file: str,
    page_number: int,
    image_base64: str
) -> Optional[Dict]:
    for attempt in range(MAX_RETRIES):
        try:
            if "base64," in image_base64:
                image_base64 = image_base64.split("base64,")[1]
            img_bytes = base64.b64decode(image_base64)
            
            model = genai.GenerativeModel(MODEL_NAME)
            generation_config = {
                "temperature": 0.3,
                "max_output_tokens": 8000
            }

            prompt_llm = prompt  

            response = model.generate_content(
                contents=[
                    {"mime_type": "image/png", "data": img_bytes},
                    prompt_llm
                ],
                generation_config=generation_config
            )

            raw_text = response.text.strip()
            json_str = extract_json(raw_text)
            print("Cadena JSON extraída:\n", json_str)
            if not json_str:
                raise ValueError("Respuesta no contiene JSON válido")
            
            # Si el texto parece ser varios objetos separados por comas (pero no es un array), conviértelo en array
            if json_str and json_str.strip().startswith('{') and not json_str.strip().startswith('['):
                if re.search(r'}\s*,\s*{', json_str):
                    json_str = '[' + json_str + ']'
            
            json_str = clean_json_string(json_str)
            json_data = json.loads(json_str)
            if isinstance(json_data, list):
                for item in json_data:
                    print("Item:", item)
                return build_response(pdf_file, page_number, json_data[0])
            else:
                return build_response(pdf_file, page_number, json_data)

        except Exception as e:
            print(f"Intento {attempt + 1} fallido: {str(e)}")
            if attempt == MAX_RETRIES - 1:
                return None
            time.sleep(REQUEST_DELAY * (attempt + 1))

def enviar_pdf_gemini(pdf_bytes: bytes, prompt: str, pdf_filename: str):
    model = genai.GenerativeModel(MODEL_NAME)
    generation_config = {
        "temperature": 0.3,
        "max_output_tokens": 8000
    }
    response = model.generate_content(
        contents=[
            {"mime_type": "application/pdf", "data": pdf_bytes},
            prompt
        ],
        generation_config=generation_config
    )
    finish_reason = None
    try:
        finish_reason = response.candidates[0].finish_reason
    except Exception:
        pass

    if str(finish_reason) == "MAX_TOKENS" or getattr(finish_reason, "name", "") == "MAX_TOKENS":
        raise ValueError("TRUNCATED_MAX_TOKENS")

    print("Respuesta completa del modelo:\n", response)

    # Extraer y mostrar el texto bruto de la respuesta
    if hasattr(response, "text") and response.text:
        raw_text = response.text.strip()
        print("Texto bruto (response.text):\n", raw_text)
    else:
        print("Respuesta no contiene atributo 'text' o está vacío.")
        raise ValueError("Respuesta del modelo vacía o sin atributo 'text'.")

    json_str = extract_json(raw_text)
    print("Cadena JSON extraída:\n", json_str)

    if not json_str:
        raise ValueError("No se pudo extraer JSON (probablemente truncado o sin bloque ```json``` completo).")

    json_str = clean_json_string(json_str)
    print("Cadena JSON limpia:\n", json_str)

    try:
        json_data = json.loads(json_str)
    except json.JSONDecodeError as jde:
        print("Error al analizar JSON:\n", json_str)
        print("Detalle del error:", str(jde))
        raise

    if isinstance(json_data, dict):
        correccion = json_data.get("correccion", [])
        comentario_general = json_data.get("comentario_general", "")
        nombre_alumno = json_data.get("nombre_alumno", "")
        nota_asignada = json_data.get("nota_asignada", 0)
        nota_max = json_data.get("nota_max", 0)
    elif isinstance(json_data, list):
        correccion = json_data
        comentario_general = ""
        nombre_alumno = ""
        nota_asignada = 0
        nota_max = 0
    else:
        correccion = []
        comentario_general = ""
        nombre_alumno = ""
        nota_asignada = 0
        nota_max = 0

    respuesta_final = {
        "correccion": correccion,
        "comentario_general": comentario_general,
        "nombre_alumno": nombre_alumno,
        "nota_asignada": nota_asignada,
        "nota_max": nota_max
    }

    return build_response(pdf_filename, respuesta_final)

