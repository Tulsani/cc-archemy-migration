from django.urls import re_path
from . import views

urlpatterns = [
    re_path(r'^index/', views.index),
    re_path(r'^login/$', views.login),
    re_path(r'^logout/$', views.logout),
    re_path(r'^register/$', views.register_page),
    re_path(r'^register/success/$', views.register_success),
    re_path(r'^exploreCatalogue/$', views.ExploreCatalogue),
    re_path(r'^ArchDev/$', views.ArchDev),
    re_path(r'^AdaptiveReuse/$', views.AdaptiveReuse),
    re_path(r'^AEL/$', views.AEL),
    re_path(r'^AEL/ideation/$', views.AelIdeation),
    re_path(r'^AEL/inception/$', views.AelInception),
    re_path(r'^AEL/elaboration/$', views.AelElaboration),
    re_path(r'^AEL/implementation/$', views.AelImplementation),
    re_path(r'^AEL/deployment/$', views.AelDeployment),
    re_path(r'^AEL/operation/$', views.AelOperations),
]
