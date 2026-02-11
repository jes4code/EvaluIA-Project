from fastapi import APIRouter, HTTPException, Body
from repo.examenes_temporales_repo import (
    insertar_examen_temporal,
    obtener_examen_temporal,
    eliminar_examen_temporal,
    actualizar_examen_temporal,
    corregir_examen
)
from fastapi import UploadFile, File, Form
import tempfile
import os
from orchestrator import procesar_pdf_completo, dividir_pdf_en_examenes
from typing import List 
from typing import Dict

router = APIRouter(prefix="/examenes_temporales", tags=["Exámenes Temporales"])

def mongo_to_dict(doc):
    if not doc:
        return None
    doc["_id"] = str(doc["_id"])
    return doc

async def procesar_subpdf(pdf_bytes_sub, idx, rubrica_id, comentarios, usuario_id, result):
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmpfile:
        tmpfile.write(pdf_bytes_sub)
        tmpfile_path = tmpfile.name  # Guardamos ruta temporal
    try:
        with open(tmpfile_path, "rb") as file_obj:
            upload_file = UploadFile(filename=f"subpdf_{idx}.pdf", file=file_obj)
            corregido = await corregir_examen(
                pdf=upload_file,
                rubrica_id=rubrica_id,
                comentarios=comentarios,
                usuario_id=usuario_id
            )
            result.append(corregido)
    finally:
        os.remove(tmpfile_path)  # Limpiar archivo temporal

@router.get("/{examen_id_temporal}")
async def obtener_examen_temporal_endpoint(examen_id_temporal: str):
    examen = obtener_examen_temporal(examen_id_temporal)
    if not examen:
        raise HTTPException(status_code=404, detail="Examen temporal no encontrado")
    examen["_id"] = str(examen["_id"])
    return examen

@router.put("/{examen_id_temporal}")
async def actualizar_examen_temporal_endpoint(
    examen_id_temporal: str,
    data: Dict = Body(...)
):
    correccion = data.get("correccion")
    if correccion is None:
        raise HTTPException(status_code=400, detail="Campo 'correccion' requerido")
    try:
        actualizar_examen_temporal(examen_id_temporal, data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"mensaje": "Corrección temporal actualizada"}

@router.delete("/{examen_id_temporal}")
async def eliminar_examen_temporal_endpoint(examen_id_temporal: str):
    success = eliminar_examen_temporal(examen_id_temporal)
    if not success:
        raise HTTPException(status_code=404, detail="Examen temporal no encontrado")
    return {"mensaje": "Examen temporal eliminado correctamente"}

@router.post("/corregir_conjuntos")
async def corregir_conjuntos(
    modo: str = Form(...),
    archivos: List[UploadFile] = File([]),
    rubrica_id: str = Form(None),
    comentarios: str = Form(""),
    usuario_id: str = Form(...),
    num_paginas: int = Form(None),
):

    result = []
    if modo == "varios":
        for f in archivos:
            with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmpfile:
                tmpfile.write(await f.read())
                tmpfile_path = tmpfile.name
            try:
                with open(tmpfile_path, "rb") as file_obj:
                    upload_file = UploadFile(filename=f.filename, file=file_obj)
                    corregido = await corregir_examen(
                        pdf=upload_file,
                        rubrica_id=rubrica_id,
                        comentarios=comentarios,
                        usuario_id=usuario_id
                    )
                    result.append(corregido)
            finally:
                os.remove(tmpfile_path)

    elif modo == "unico" and archivos:
        pdf_bytes = await archivos[0].read()
        pdfs_divididos = dividir_pdf_en_examenes(pdf_bytes, num_paginas)
        for idx, pdf_bytes_sub in enumerate(pdfs_divididos, start=1):
            await procesar_subpdf(
                pdf_bytes_sub, idx, rubrica_id, comentarios, usuario_id, result
            )

    return {"resultados": result}

@router.post("/corregir-examen")
async def corregir_examen_endpoint(
    pdf: UploadFile = File(...),
    rubrica_id: str = Form(None),
    comentarios: str = Form(""),
    usuario_id: str = Form(...)
):
    try:
        resultado = await corregir_examen(
            pdf=pdf,
            rubrica_id=rubrica_id,
            comentarios=comentarios,
            usuario_id=usuario_id
        )
        return resultado
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))