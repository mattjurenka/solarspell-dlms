# Generated by Django 3.0.4 on 2021-02-27 00:18

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('content_management', '0015_auto_20210226_1702'),
    ]

    operations = [
        migrations.AddConstraint(
            model_name='libraryversion',
            constraint=models.UniqueConstraint(fields=('library_name', 'version_number'), name='unique name and number'),
        ),
    ]
