from django.db import models
from django.contrib.auth.models import User

class Empresa(models.Model):
    nombre = models.CharField(max_length=100)
    def __str__(self):
        return self.nombre

class Faena(models.Model):
    empresa = models.ForeignKey(Empresa, on_delete=models.CASCADE)
    nombre = models.CharField(max_length=100)
    def __str__(self):
        return f"{self.empresa.nombre} - {self.nombre}"

class Ubicacion(models.Model):
    faena = models.ForeignKey('Faena', on_delete=models.CASCADE, related_name='ubicaciones')
    nombre = models.CharField(max_length=100)
    latitud = models.DecimalField(max_digits=9, decimal_places=6)
    longitud = models.DecimalField(max_digits=9, decimal_places=6)
    def __str__(self):
        return f"{self.nombre} ({self.faena.nombre})"

class Perfil(models.Model):
    ROLES = (
        ('ADMIN', 'Administrador'),
        ('OPERADOR', 'Operador'),
    )
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    empresa = models.ForeignKey(Empresa, on_delete=models.CASCADE)
    faena = models.ForeignKey('Faena', on_delete=models.CASCADE, null=True, blank=True)
    rol = models.CharField(max_length=20, choices=ROLES, default='OPERADOR')
    def __str__(self):
        return f"{self.user.username} - {self.rol}"

class Vehiculo(models.Model):
    empresa = models.ForeignKey(Empresa, on_delete=models.CASCADE)
    faena = models.ForeignKey(Faena, on_delete=models.CASCADE, null=True, blank=True)  # <--- AGREGA ESTO
    patente = models.CharField(max_length=20)
    descripcion = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return self.patente

class Herramienta(models.Model):
    empresa = models.ForeignKey(Empresa, on_delete=models.CASCADE)
    faena = models.ForeignKey(Faena, on_delete=models.CASCADE, null=True, blank=True)  # <--- AGREGA ESTO
    nombre = models.CharField(max_length=100)

    def __str__(self):
        return self.nombre

class Tarea(models.Model):
    ESTADOS = (
        ('INICIADA', 'Iniciada'),
        ('FINALIZADA', 'Finalizada'),
    )
    empresa = models.ForeignKey(Empresa, on_delete=models.CASCADE)
    faena = models.ForeignKey(Faena, on_delete=models.CASCADE)
    ubicacion = models.ForeignKey(Ubicacion, on_delete=models.CASCADE)
    operador = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tareas_operador')
    personas_involucradas = models.ManyToManyField(User, related_name='tareas_involucrado')
    vehiculos = models.ManyToManyField(Vehiculo)
    herramientas = models.ManyToManyField(Herramienta)
    descripcion = models.TextField()
    estado = models.CharField(max_length=20, choices=ESTADOS, default='INICIADA')
    foto_inicio = models.ImageField(upload_to='fotos_tareas/', null=True, blank=True)
    foto_fin = models.ImageField(upload_to='fotos_tareas/', null=True, blank=True)
    observaciones = models.TextField(blank=True, null=True)
    fecha_inicio = models.DateTimeField()
    fecha_fin = models.DateTimeField(null=True, blank=True)
    duracion_minutos = models.PositiveIntegerField(null=True, blank=True)  # Se calcula al finalizar
    def __str__(self):
        return f"Tarea {self.id} - {self.estado}"

