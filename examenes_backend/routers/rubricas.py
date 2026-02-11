from fastapi import APIRouter, HTTPException
from typing import List
from repo.rubricas_repo import crear_rubrica, obtener_rubricas, editar_rubrica, eliminar_rubrica, obtener_rubrica_por_id

router = APIRouter(prefix="/rubricas", tags=["Rúbricas"])

@router.post("/crear")
async def crear_rubrica_endpoint(rubrica: dict):
    # Validar campos obligatorios principales
    if not rubrica.get("creador") or not rubrica.get("nombre") or not rubrica.get("preguntas"):
        raise HTTPException(status_code=400, detail="Faltan campos obligatorios")

    # Validar cada pregunta y sus enunciados (criterios)
    for pregunta in rubrica["preguntas"]:
        if "texto" not in pregunta or not pregunta["texto"]:
            raise HTTPException(status_code=400, detail="Falta el texto de alguna pregunta")
        if "enunciados" not in pregunta or not pregunta["enunciados"]:
            raise HTTPException(status_code=400, detail="Faltan enunciados en alguna pregunta")

        for enunciado in pregunta["enunciados"]:
            if not all(k in enunciado for k in ("criterio", "puntos")):
                raise HTTPException(status_code=400, detail="Formato de criterio inválido en algún enunciado")

    # Aquí llamarías a la función que guarda la rúbrica y devuelve el id
    rubrica_id = crear_rubrica(rubrica)

    return {"mensaje": "Rúbrica creada con éxito", "id": rubrica_id}

@router.get("/{profesor_email}")
async def obtener_rubricas_endpoint(profesor_email: str):
    return obtener_rubricas(profesor_email)

@router.get("/obtener/{rubrica_id}")
async def obtener_rubrica_por_id_endpoint(rubrica_id: str):
    rubrica = obtener_rubrica_por_id(rubrica_id)
    if not rubrica:
        raise HTTPException(status_code=404, detail="Rúbrica no encontrada")
    return rubrica

@router.put("/{rubrica_id}")
async def editar_rubrica_endpoint(rubrica_id: str, nuevos_datos: dict):
    if editar_rubrica(rubrica_id, nuevos_datos):
        return {"mensaje": "Rúbrica actualizada"}
    else:
        raise HTTPException(status_code=404, detail="Rúbrica no encontrada")

@router.delete("/{rubrica_id}")
async def eliminar_rubrica_endpoint(rubrica_id: str):
    if eliminar_rubrica(rubrica_id):
        return {"mensaje": "Rúbrica eliminada"}
    else:
        raise HTTPException(status_code=404, detail="Rúbrica no encontrada")
