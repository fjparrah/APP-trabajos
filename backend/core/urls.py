# core/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    EmpresaViewSet, FaenaViewSet, UbicacionViewSet,
    VehiculoViewSet, HerramientaViewSet, TareaViewSet, UserViewSet, me
)

router = DefaultRouter()
router.register(r'empresas', EmpresaViewSet)
router.register(r'faenas', FaenaViewSet)
router.register(r'ubicaciones', UbicacionViewSet)
router.register(r'vehiculos', VehiculoViewSet)
router.register(r'herramientas', HerramientaViewSet)
router.register(r'tareas', TareaViewSet)
router.register(r'users', UserViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('me/', me, name='me'),   # <--- ¡Agrega esto!
]

