# examenes_temporales_repo.py
from typing import Dict
from database import db
from bson import ObjectId
import os
from fastapi import UploadFile
from orchestrator import procesar_pdf_completo, dividir_pdf_en_examenes

collection = db["examenes_temporales"]

def insertar_examen_temporal(json_data):
    """Inserta un examen en la colección de temporales."""
    resultado = collection.insert_one(json_data)
    return str(resultado.inserted_id)

def obtener_examen_temporal(examen_id_temporal: str):
    """Obtiene un examen temporal por su identificador temporal (_id)."""
    try:
        obj_id = ObjectId(examen_id_temporal)
    except Exception:
        return None
    return collection.find_one({"_id": obj_id})

def eliminar_examen_temporal(examen_id_temporal):
    """Elimina un examen temporal tras su revisión."""
    return collection.delete_one({"examen_id_temporal": examen_id_temporal})

def actualizar_examen_temporal(examen_id_temporal_str: str, datos_actualizados: dict) -> None:
    try:
        examen_id = ObjectId(examen_id_temporal_str)
    except Exception:
        raise ValueError("ID inválido")

    # Obtener documento original
    examen_actual = db["examenes_temporales"].find_one({"_id": examen_id})
    if not examen_actual:
        raise ValueError("Examen temporal no encontrado")

    correccion_obj = examen_actual.get("correccion", {})
    metadata_actual = correccion_obj.get("metadata", {})

    # Construir nueva corrección preservando metadata
    correccion_actualizada = {
        "metadata": metadata_actual,
        "correccion": datos_actualizados.get("correccion", correccion_obj.get("correccion", [])),
        "nombre_alumno": datos_actualizados.get("nombre_alumno", correccion_obj.get("nombre_alumno", "")),
        "comentario_general": datos_actualizados.get("comentario_general", correccion_obj.get("comentario_general", "")),
        "nota_asignada": datos_actualizados.get("nota_asignada", correccion_obj.get("nota_asignada", 0)),
        "nota_max": datos_actualizados.get("nota_max", correccion_obj.get("nota_max", 0)),
    }

    # Campos fuera que actualizar también
    cambios_raiz = {}
    for campo in ["nombre_alumno", "comentario_general", "estado"]:
        if campo in datos_actualizados:
            cambios_raiz[campo] = datos_actualizados[campo]

    # Unión de todos los campos a actualizar
    cambios = {"correccion": correccion_actualizada}
    cambios.update(cambios_raiz)

    db["examenes_temporales"].update_one(
        {"_id": examen_id},
        {"$set": cambios}
    )
    
async def corregir_examen(
    pdf: UploadFile,
    rubrica_id: str = None,
    comentarios: str = "",
    usuario_id: str = None,
) -> dict:
    try:
        criterios_texto = ""
        criterios_json = []

        if rubrica_id:
            from repo.rubricas_repo import obtener_rubrica_por_id  # Import local para evitar imports circulares
            rubrica = obtener_rubrica_por_id(rubrica_id)
            if not rubrica:
                raise Exception("Rúbrica no encontrada")

            criterios_texto_list = []
            preguntas = rubrica.get("preguntas", [])
            for pregunta in preguntas:
                texto_pregunta = pregunta.get("texto", "")
                criterios_texto_list.append(f"Pregunta: {texto_pregunta}")

                enunciados = pregunta.get("enunciados", [])
                for enunciado in enunciados:
                    criterio = enunciado.get("criterio", "")
                    puntos = enunciado.get("puntos", "")
                    criterios_texto_list.append(f"- {criterio} ({puntos} puntos)")

            criterios_texto = "\n".join(criterios_texto_list)

        os.makedirs("temp", exist_ok=True)
        temp_path = os.path.join("temp", pdf.filename)
        with open(temp_path, "wb") as f:
            f.write(await pdf.read())

        prompt = "Corrige el examen según las instrucciones y rúbrica (si se proporciona).\n\n"
        if criterios_texto:
            prompt += f"Utiliza la siguiente rúbrica:\n{criterios_texto}\n\n"
        prompt += f"Instrucciones adicionales del profesor:\n{comentarios}\n\n"
        prompt += (
            'Si una pregunta no tiene respuesta del estudiante, indícalo explícitamente en el campo "respuesta" con el valor "Sin respuesta", '
            'pon comentario aclaratorio y asigna puntuación 0.\n\n'
            'Si detectas un bloque de código o una expresión matemática compleja en la respuesta del estudiante, no es necesario que la transcribas literalmente. En su lugar, ofrece un resumen breve y claro sobre la función o propósito de ese código o expresión.\n\n'
            "Formato de salida:\n"
            "Devuelve EXCLUSIVAMENTE un objeto JSON con esta estructura:\n"
            "{\n"
            '  "correccion": [\n'
            "    {\n"
            '      "pregunta": "nº o nombre de pregunta",\n'
            '      "enunciado": "texto literal",\n'
            '      "respuesta": "respuesta detectada o \'Sin respuesta\'",\n'
            '      "puntuacion_max": puntuación máxima de la pregunta,\n'
            '      "puntuacion_asignada": la puntuación que le asignas a la respuesta del estudiante,\n'
            '      "comentarios": "correción que has hecho del ejercicio del alumno y en que debe mejorar para obtener la máxima nota en ese ejercicio"\n'
            "    }\n"
            "  ],\n"
            '  "nombre_alumno": "nombre del alumno que ha realizado el examen, si no se detecta quedar en blanco, quiero el nombre en el formato Apellido1 Apellido2, Nombre(ej: Moruno Muñozo, Jesús)",\n'
            '  "comentario_general": "Texto del análisis general que resuma el desempeño global del estudiante, fortalezas, áreas de mejora y recomendaciones."\n'
            '  "nota_asignada": "Suma de todas las puntuacion_asignada de todos los ejercicios que has evaluado"\n'
            '  "nota_max": "Suma de todas las puntuacion_max de todos los ejercicios"\n'
            "}\n"
            "No incluyas nada fuera de ese JSON."
        )

        # Aquí tendrás que importar procesar_pdf_completo e insertar_examen_temporal del sitio correspondiente
        resultado = procesar_pdf_completo(temp_path, prompt)
        os.remove(temp_path)

        examen_temporal = {
            "nombre_archivo": pdf.filename,
            "usuario_id": usuario_id,
            "rubrica_id": rubrica_id,
            "criterios": criterios_json,
            "comentarios_extra": comentarios,
            "correccion": resultado,
            "nombre_alumno": resultado.get("nombre_alumno"),
            "comentario_general": resultado.get("comentario_general"),
            "estado": "pendiente_revision",
        }

        examen_temporal_id = insertar_examen_temporal(examen_temporal)

        return {
            "mensaje": "Corrección generada y guardada temporalmente",
            "examen_id_temporal": examen_temporal_id,
            "nombre_archivo": pdf.filename,
            "usuario_id": usuario_id,
            "rubrica_id": rubrica_id,
            "criterios": criterios_json,
            "comentarios_extra": comentarios,
            "nombre_alumno": resultado.get("nombre_alumno"),
            "comentario_general": resultado.get("comentario_general"),
            "correccion": resultado
        }
    except Exception as e:
        raise e
