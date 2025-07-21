from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('api/chat', views.chat_api, name='chat_api'),
    path('api/update_notes', views.update_notes_api, name='update_notes_api'),
    path('api/history', views.get_history_api, name='get_history_api'),
    path('api/session_info', views.session_info_api, name='session_info_api'),
    path('api/reset_session_timeout', views.reset_session_timeout, name='reset_session_timeout'),
]