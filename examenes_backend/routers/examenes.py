from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import List
from repo.examen_repo import (
    obtener_todos_examenes_usuario,
    obtener_examen,
    guardar_correccion_examen
    , actualizar_examen
)
from fastapi.responses import StreamingResponse
import io

router = APIRouter(prefix="/examenes", tags=["Exámenes"])

@router.get("/todos_mis_examenes/{usuario_id}")
async def obtener_examenes_completos_usuario(usuario_id: str):
    try:
        todos = obtener_todos_examenes_usuario(usuario_id)
        return {"examenes": todos}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{examen_id}")
async def obtener_examen_endpoint(examen_id: str):
    examen = obtener_examen(examen_id)
    if not examen:
        raise HTTPException(status_code=404, detail="Examen no encontrado")
    return examen

@router.put("/{examen_id}")
async def actualizar_examen_endpoint(examen_id: str, datos_actualizados: dict):
    try:
        examen_actualizado = actualizar_examen(examen_id, datos_actualizados)
        return {
            "mensaje": "Examen actualizado correctamente",
            "examen": examen_actualizado
        }
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/guardar_correccion/{examen_id_temporal}")
async def guardar_examen_endpoint(examen_id_temporal: str):
    try:
        nuevo_id = guardar_correccion_examen(examen_id_temporal)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return {
        "mensaje": "Corrección confirmada y movida a colección definitiva",
        "examen_id": nuevo_id,
    }

@router.get("/descargar_informe/{examen_id}")
async def descargar_informe(examen_id: str):
    examen = obtener_examen(examen_id)
    if not examen:
        raise HTTPException(status_code=404, detail="Examen no encontrado")

    from orchestrator import generar_informe_pdf  

    pdf_bytes = generar_informe_pdf(examen)

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=Informe_Examen_{examen_id}.pdf"}
    )
