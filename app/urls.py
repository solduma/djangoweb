from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('api/chat', views.chat_api, name='chat_api'),
    path('api/update_notes', views.update_notes_api, name='update_notes_api'),
]