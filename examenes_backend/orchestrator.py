import os
from utils.llm_client_goo import enviar_imagen
from fpdf import FPDF
from utils.llm_client_goo import enviar_pdf_gemini
import io
import tempfile
from PyPDF2 import PdfReader, PdfWriter

def procesar_pdf_completo(pdf_path, prompt):
    try:
        with open(pdf_path, "rb") as f:
            pdf_bytes = f.read()
        resultado = enviar_pdf_gemini(pdf_bytes, prompt, os.path.basename(pdf_path))
        # Extraer solo la lista con las correcciones
        correcciones = resultado.get("results") or resultado.get("resultados") or resultado
        if correcciones is None:
            raise ValueError("No se encontraron correcciones en la respuesta")
        return correcciones
    except Exception as e:
        raise


def generar_informe_pdf(examen: dict) -> bytes:
    pdf = FPDF()
    pdf.add_page()
    pdf.set_left_margin(10)
    pdf.set_right_margin(10)

    pdf.set_font("Arial", size=14)
    nombre_alumno = examen.get("nombre_alumno", "Desconocido")
    pdf.cell(0, 10, txt=f"Informe de examen - {nombre_alumno}", ln=True, align="C")
    pdf.ln(10)

    pdf.set_font("Arial", size=12)
    correccion_data = examen.get("correccion", {})
    nota_asignada = correccion_data.get("nota_asignada", "N/A")
    nota_max = correccion_data.get("nota_max", "N/A")
    pdf.cell(0, 10, txt=f"Nota final: {nota_asignada} / {nota_max}", ln=True)
    pdf.ln(5)

    comentario_general = examen.get("correccion", {}).get("comentario_general", "")
    pdf.multi_cell(0, 10, txt=f"Comentario general:\n{comentario_general}")
    pdf.ln(10)

    preguntas = examen.get("correccion", {}).get("correccion", [])
    width = 190
    for i, pregunta in enumerate(preguntas, start=1):
        pdf.set_font("Arial", style='B', size=12)
        num_pregunta = pregunta.get('pregunta', str(i))
        pdf.multi_cell(width, 8, txt=f"Pregunta {num_pregunta}: {pregunta.get('enunciado', '')}")
        pdf.set_font("Arial", size=11)
        pdf.multi_cell(width, 8, txt=f"Respuesta: {pregunta.get('respuesta', '')}")
        puntuacion_asignada = pregunta.get("puntuacion_asignada", 0)
        puntuacion_max = pregunta.get("puntuacion_max", 0)
        pdf.cell(0, 10, txt=f"Puntuación: {puntuacion_asignada} / {puntuacion_max}", ln=True)
        pdf.multi_cell(width, 8, txt=f"Comentarios: {pregunta.get('comentarios', '')}")
        pdf.ln(5)

    return pdf.output(dest='S').encode('latin1')

def dividir_pdf_en_examenes(pdf_bytes, paginas_por_examen):
    print("Debug: Inicio división de PDF")
    reader = PdfReader(io.BytesIO(pdf_bytes))
    total_paginas = len(reader.pages)
    print(f"Debug: Total de páginas en PDF original: {total_paginas}")
    examenes = []
    
    with tempfile.TemporaryDirectory() as temp_dir:
        print(f"Debug: Carpeta temporal creada en: {temp_dir}")
        for i in range(0, total_paginas, paginas_por_examen):
            print(f"Debug: Procesando páginas {i} a {min(i + paginas_por_examen, total_paginas) - 1}")
            writer = PdfWriter()
            for pg in range(i, min(i + paginas_por_examen, total_paginas)):
                writer.add_page(reader.pages[pg])
            output_stream = io.BytesIO()
            writer.write(output_stream)
            pdf_bytes_sub = output_stream.getvalue()
            print(f"Debug: Sub-PDF generado con {len(pdf_bytes_sub)} bytes")
            
            filename = os.path.join(temp_dir, f"subpdf_{i//paginas_por_examen + 1}.pdf")
            with open(filename, "wb") as f:
                f.write(pdf_bytes_sub)
            print(f"Debug: Sub-PDF guardado en {filename}")
            
            examenes.append(pdf_bytes_sub)
        
        print(f"Debug: Total de sub-PDFs generados: {len(examenes)}")
        
        return examenes

