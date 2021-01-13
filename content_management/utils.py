import datetime
import json
import os
from typing import Dict, Union

from django.utils import timezone
from rest_framework import status
from django.db.models.functions import Substr

from dlms import settings
from content_management.library_db_utils import LibraryDbUtil
from content_management.models import (
    Content,
    Metadata, MetadataType, LibraryFolder, LibraryModule, LibraryVersion)

import hashlib


class ContentSheetUtil:

    def upload_sheet_contents(self, sheet_contents):
        """
        This method adds bulk content data from the Excel sheet uploaded
        :param sheet_contents:
        :return: success status
        """
        unsuccessful_uploads = []
        successful_uploads_count = 0
        try:
            content_data = json.loads(sheet_contents.get("sheet_data"))
            for each_content in content_data:
                # if the actual file is not uploaded, don't upload its metadata
                if sheet_contents.get(each_content.get("FileName")) is None:
                    continue
                else:
                    try:
                        content = Content()
                        content.file_name = each_content.get("FileName")
                        content.content_file = sheet_contents.get(each_content.get("FileName"))
                        content.title = each_content.get("Title")
                        content.description = each_content.get("Description")
                        content.copyright = each_content.get("Copyright")
                        content.rights_statement = each_content.get("RightsStatement")
                        if each_content.get("PublishedDate"):
                            content.published_date = datetime.date(each_content.get("PublishedDate"), 1, 1)
                        content.modified_on = timezone.now()
                        content.active = True
                        content.save()
                        metadata = get_associated_meta(each_content)
                        for metadata_item in metadata:
                            obj, created = Metadata.objects.get_or_create(name=metadata_item.name,
                                                                          type=metadata_item.type)
                            content.metadata.add(obj)
                        content.save()
                        successful_uploads_count = successful_uploads_count + 1
                    except Exception as e:
                        unsuccessful_uploads.append({'file_name': each_content.get("FileName"), 'error': str(e)
                                                    .partition('DETAIL:')[-1]})
                        continue
            data = {
                'success_count': successful_uploads_count,
                'unsuccessful_uploads': unsuccessful_uploads,
            }
            return data

        except Exception as e:
            data = {
                'success': False,
                'error': str(e),
                'status': status.HTTP_500_INTERNAL_SERVER_ERROR
            }
            return data


def get_associated_meta(sheet_row):
    meta_list = []
    for metadata_type in MetadataType.objects.all():
        if sheet_row.get(metadata_type.name) == '' or sheet_row.get(metadata_type.name) is None:
            continue
        meta_values = sheet_row[metadata_type.name].split(' | ')
        for each_value in meta_values:
            metadata = Metadata(name=each_value, type=metadata_type)
            meta_list.append(metadata)
    return meta_list


class LibraryBuildUtil:

    def build_library(self, version_id):
        metadata_types = LibraryVersion.metadata_types.through.objects.filter(libraryversion__id=version_id) \
            .values_list('metadatatype_id', 'metadatatype__name')
        metadata = Metadata.objects.filter(content__libraryfolder__version_id=version_id) \
            .filter(type__pk__in=metadata_types.values_list('metadatatype_id')).values_list('id', 'name',
                                                                                            'type__name',
                                                                                            'type_id').distinct('id')
        folders = LibraryFolder.objects.filter(version_id=version_id).values_list('id', 'folder_name',
                                                                                  'logo_img__image_file', 'parent_id')
        modules = LibraryModule.objects.filter(libraryversion__id=version_id).values_list('id', 'module_name',
                                                                                          'logo_img__image_file')
        contents = Content.objects.filter(libraryfolder__version_id=version_id).values_list('id', 'title', 'description'
                                                                                            , Substr('content_file', 10),
                                                                                            'published_date',
                                                                                            'copyright_notes',
                                                                                            'rights_statement',
                                                                                            'filesize') \
            .distinct('id')
        contents_metadata = Content.metadata.through.objects.filter(content__libraryfolder__version_id=version_id) \
            .values_list('content_id', 'metadata_id')
        contents_folder = LibraryFolder.library_content.through.objects.filter(libraryfolder__version_id=version_id) \
            .values_list('content_id', 'libraryfolder_id', 'libraryfolder__library_content__title', \
                         'libraryfolder__library_content__filesize')
        db_util = LibraryDbUtil(metadata_types, metadata, folders, modules, contents, contents_metadata,
                                contents_folder)
        db_util.create_library_db()
        return 'success'


def sha256(bytestream):
    hash_sha256 = hashlib.sha256()
    for chunk in iter(lambda: bytestream.read(4096), b""):
        hash_sha256.update(chunk)
    return hash_sha256.hexdigest()
