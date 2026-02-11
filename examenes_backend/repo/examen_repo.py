from database import db

from bson import ObjectId

collection = db["correcciones"]  

def guardar_correccion_examen(examen_id_temporal_str: str) -> str:
    try:
        examen_id_temporal = ObjectId(examen_id_temporal_str)
    except Exception:
        raise ValueError("Id inválido")

    examen_temp = db["examenes_temporales"].find_one({"_id": examen_id_temporal})
    if not examen_temp:
        raise ValueError("Examen temporal no encontrado")

    examen_temp["estado"] = "success"

    result = db["correcciones"].insert_one(examen_temp)

    db["examenes_temporales"].delete_one({"_id": examen_id_temporal})

    return str(result.inserted_id)

def insertar_examen(json_data):
    """Inserta un JSON en la colección correcciones."""
    resultado = collection.insert_one(json_data)
    return str(resultado.inserted_id)  # Retorna el ID del documento insertado

def obtener_examen(examen_id: str):
    """Obtiene un examen corregido por su ID."""
    try:
        obj_id = ObjectId(examen_id)
    except Exception:
        return None
    
    examen = collection.find_one({"_id": obj_id})
    if examen:
        examen["_id"] = str(examen["_id"])  
    return examen

def obtener_todos_examenes_usuario(usuario_id: str):

    examenes_temporales = list(db["examenes_temporales"].find({"usuario_id": usuario_id}))

    correcciones = list(db["correcciones"].find({"usuario_id": usuario_id}))

    for ex in examenes_temporales:
        ex["tipo"] = "temporal"

    for ex in correcciones:
        ex["tipo"] = "definitivo"

    todos_examenes = examenes_temporales + correcciones

    for examen in todos_examenes:
        examen["_id"] = str(examen["_id"])

    return todos_examenes

def actualizar_examen(examen_id_str: str, datos_actualizados: dict) -> dict:
    try:
        examen_id = ObjectId(examen_id_str)
    except Exception:
        raise ValueError("ID inválido")

    examen_actual = db["correcciones"].find_one({"_id": examen_id})
    if not examen_actual:
        raise ValueError("Examen no encontrado")

    correccion_obj = examen_actual.get("correccion", {})
    metadata_actual = correccion_obj.get("metadata", {})

    # Construir correccion interna preservando metadata
    correccion_actualizada = {
        "metadata": metadata_actual,
        "correccion": datos_actualizados.get("correccion", correccion_obj.get("correccion", [])),
        "nombre_alumno": datos_actualizados.get("nombre_alumno", correccion_obj.get("nombre_alumno", "")),
        "comentario_general": datos_actualizados.get("comentario_general", correccion_obj.get("comentario_general", "")),
        "nota_asignada": datos_actualizados.get("nota_asignada", correccion_obj.get("nota_asignada", 0)),
        "nota_max": datos_actualizados.get("nota_max", correccion_obj.get("nota_max", 0)),
    }

    cambios_raiz = {}
    for campo in ["nombre_alumno", "comentario_general", "estado"]:
        if campo in datos_actualizados:
            cambios_raiz[campo] = datos_actualizados[campo]

    cambios = {"correccion": correccion_actualizada}
    cambios.update(cambios_raiz)

    resultado = db["correcciones"].find_one_and_update(
        {"_id": examen_id},
        {"$set": cambios},
        return_document=True
    )

    if not resultado:
        raise ValueError("Examen no encontrado")

    resultado["_id"] = str(resultado["_id"])
    return resultado
