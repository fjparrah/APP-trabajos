# core/admin.py

from django.contrib import admin
from .models import (
    Empresa,
    Faena,
    Ubicacion,
    Perfil,
    Vehiculo,
    Herramienta,
    Tarea,
)

@admin.register(Empresa)
class EmpresaAdmin(admin.ModelAdmin):
    list_display = ('nombre',)
    search_fields = ('nombre',)


@admin.register(Faena)
class FaenaAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'empresa')
    list_filter = ('empresa',)
    search_fields = ('nombre', 'empresa__nombre')


@admin.register(Ubicacion)
class UbicacionAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'faena', 'latitud', 'longitud')
    list_filter = ('faena',)
    search_fields = ('nombre', 'faena__nombre')


@admin.register(Perfil)
class PerfilAdmin(admin.ModelAdmin):
    list_display = ('user', 'empresa', 'rol')
    list_filter = ('rol', 'empresa')
    search_fields = ('user__username', 'empresa__nombre')


@admin.register(Vehiculo)
class VehiculoAdmin(admin.ModelAdmin):
    list_display = ('patente', 'descripcion', 'empresa')
    list_filter = ('empresa',)
    search_fields = ('patente',)


@admin.register(Herramienta)
class HerramientaAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'empresa')
    list_filter = ('empresa',)
    search_fields = ('nombre',)


@admin.register(Tarea)
class TareaAdmin(admin.ModelAdmin):
    list_display = ('id', 'descripcion_short', 'estado', 'empresa', 'faena', 'operador', 'fecha_inicio', 'fecha_fin')
    list_filter = ('estado', 'empresa', 'faena', 'operador')
    search_fields = ('descripcion', 'operador__username')
    readonly_fields = ('duracion_minutos',)

    def descripcion_short(self, obj):
        return obj.descripcion[:50] + ('…' if len(obj.descripcion) > 50 else '')
    descripcion_short.short_description = 'Descripción'

