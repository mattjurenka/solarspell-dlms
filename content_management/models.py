import os
from _datetime import datetime

from django.db import models


class MetadataType(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name


class Metadata(models.Model):
    name = models.CharField(max_length=300)
    type = models.ForeignKey(MetadataType, on_delete=models.CASCADE)

    def __str__(self):
        return f'[{self.type}]{self.name}'


class Content(models.Model):
    def set_file_name(self, file_name):
        self.file_name = file_name
        return os.path.join("contents", file_name)

    file_name = models.CharField(max_length=300)
    content_file = models.FileField("File", upload_to=set_file_name, max_length=300)
    title = models.CharField(max_length=300)
    description = models.TextField(null=True)
    modified_on = models.DateTimeField(default=datetime.now)
    metadata = models.ManyToManyField(Metadata)
    copyright = models.CharField(max_length=500, null=True)
    rights_statement = models.TextField(null=True)
    published_date = models.DateField(null=True)
    active = models.BooleanField(default=1)

    class Meta:
        ordering = ['pk']

    def __str__(self):
        return f'{self.title}'


class LibLayoutImage(models.Model):

    def get_folder_name(self, file_name):
        if self.image_group is 1:
            return os.path.join("images", "logos", file_name)
        elif self.image_group is 2:
            return os.path.join("images", "banners", file_name)
        elif self.image_group is 3:
            return os.path.join("images", "libversions", file_name)

    GROUPS = (
        (1, 'Logo'),
        (2, 'Banner'),
        (3, 'Version'),
    )
    image_file = models.FileField(upload_to=get_folder_name)
    image_group = models.PositiveSmallIntegerField(choices=GROUPS, default=3)

    def __str__(self):
        return f'{self.image_file.name}'


class LibraryVersion(models.Model):
    library_name = models.CharField(max_length=300)
    version_number = models.CharField(max_length=300)
    library_banner = models.ForeignKey(LibLayoutImage, related_name="versions", on_delete=models.SET_NULL,
                                       null=True)

    def __str__(self):
        return f'[{self.library_name}]{self.version_number}'


class LibraryFolder(models.Model):
    folder_name = models.CharField(max_length=300)
    banner_img = models.ForeignKey(LibLayoutImage, related_name="banners", on_delete=models.SET_NULL, null=True)
    logo_img = models.ForeignKey(LibLayoutImage, related_name="logos", on_delete=models.SET_NULL, null=True)
    version = models.ForeignKey(LibraryVersion, related_name='folders', on_delete=models.CASCADE)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, related_name="subfolders", null=True)
    library_content = models.ManyToManyField(Content, blank=True)

    def __str__(self):
        return f'{self.folder_name}'
