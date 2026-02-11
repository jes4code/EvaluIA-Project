import time
import json
import re
from openai import OpenAI
import base64
import os
import unicodedata

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
if not OPENROUTER_API_KEY:
    raise RuntimeError("Falta OPENROUTER_API_KEY en variables de entorno")

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=OPENROUTER_API_KEY
)

def sanitize_filename(filename):
    """
    Convierte un nombre de archivo con caracteres no ASCII a un nombre compatible con ASCII.
    """
    filename = unicodedata.normalize('NFKD', filename).encode('ASCII', 'ignore').decode('ASCII')
    filename = filename.replace(' ', '_').lower()
    return filename

def enviar_imagen(prompt, pdf_file, page_number, image_base64=None, image_url=None):
    """
    Envía un prompt con texto e imagen (base64 o URL) a un LLM multimodal y recibe la respuesta cruda.
    """
    if image_base64:
        image_data_url = f"data:image/png;base64,{image_base64}"
    elif image_url:
        image_data_url = image_url
    else:
        image_data_url = None

    instruccion_json = "\n\nResponde únicamente en formato JSON válido. "
    prompt_con_contexto = f"{prompt}\n\nArchivo: {pdf_file}, Página: {page_number}.{instruccion_json}"
    prompt_con_contexto = prompt_con_contexto.encode("utf-8", "ignore").decode("utf-8")

    try:
        response = client.chat.completions.create(
            extra_headers={
                "HTTP-Referer": "http://localhost",
            },
            model="google/gemini-2.0-flash-thinking-exp:free",
            messages=[{
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt_con_contexto}
                ]
            }] + (
                [{"type": "image_url", "image_url": {"url": image_data_url}}] if image_data_url else []
            ),
            max_tokens=1024
        )

        texto = response.choices[0].message.content
        
        
        print(f" Respuesta cruda del LLM:\n{texto}\n")

        return {
            "pdf_file": pdf_file,
            "page_number": page_number,
            "raw_response": texto  
        }

    except Exception as e:
        print(f"Error: {e}")
        return None
    finally:
        time.sleep(2)

