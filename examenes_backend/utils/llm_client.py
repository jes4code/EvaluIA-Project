import time
import json
import re
from openai import OpenAI
import os

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise RuntimeError("Falta OPENAI_API_KEY en variables de entorno")

client = OpenAI(api_key=OPENAI_API_KEY)

def enviar_imagen(prompt, pdf_file, page_number, image_base64):
    image_data_url = f"data:image/png;base64,{image_base64}"
    instruccion_json = (
        "\n\nResponde únicamente en formato JSON válido. "
    )

    prompt_con_contexto = (
        f"{prompt}\n\nArchivo: {pdf_file}, Página: {page_number}.{instruccion_json}"
    )

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt_con_contexto},
                    {"type": "image_url", "image_url": {"url": image_data_url}}
                ]
            }],
            max_tokens=1024
        )
        texto = response.choices[0].message.content

        data_json = extract_json(texto)

        if data_json:
            print(f"JSON recibido (Página {page_number})")
            print(f"Respuesta cruda del LLM (Página {page_number}):\n{texto}\n")
            print(f"JSON parseado (Página {page_number}):\n{json.dumps(data_json, indent=2)}\n")
            return {
                "pdf_file": pdf_file,
                "page_number": page_number,
                "json_data": data_json
            }
        else:
            print(f"El modelo no devolvió un JSON válido:\n{texto}")
            return None

    except Exception as e:
        print(f"Error en {pdf_file} Página {page_number}: {e}")
        return None
    finally:
        time.sleep(2)

def extract_json(text):
    """
    Intenta extraer un JSON válido desde un texto generado por LLM.
    """
    try:
        # Intenta parsear directamente
        return json.loads(text)
    except json.JSONDecodeError:
        # Extraer con regex el primer bloque {...} que parezca JSON
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except json.JSONDecodeError:
                return None
        return None
