# Generated by Django 3.0.4 on 2020-06-23 09:19

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('content_management', '0002_auto_20200617_0713'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='content',
            name='file_name',
        ),
    ]
