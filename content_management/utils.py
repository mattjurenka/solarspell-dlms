import datetime
import os
from typing import Dict, Union

from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response

from dlms import settings
from content_management.library_db_utils import LibraryDbUtil
from content_management.models import (
    Content,
    Metadata, MetadataType, LibraryFolder)


class ContentSheetUtil:

    def upload_sheet_contents(self, sheet_contents):
        """
        This method adds bulk content data from the Excel sheet uploaded
        :param sheet_contents:
        :return: success status
        """
        try:
            for each_content in sheet_contents:
                # if the actual file is not uploaded, don't upload its metadata
                file_path = os.path.join(os.path.relpath(settings.MEDIA_ROOT), "contents", each_content.get("fileName"))
                if os.path.exists(file_path) is not True:
                    continue
                else:
                    content = Content()
                    content.file_name = each_content.get("fileName")
                    content.content_file.name = "contents/" + content.file_name
                    content.title = each_content.get("title")
                    content.copyright = each_content.get("copyright")
                    content.rights_statement = each_content.get("rightsStatement")
                    if each_content.get("publishedDate") is not None:
                        content.published_date = datetime.date(each_content.get("publishedDate"), 1, 1)
                    content.modified_on = timezone.now()
                    content.active = True
                    content.save()
                    for metadata_item in each_content.get("metadata"):
                        obj, created = Metadata.objects.get_or_create(name=metadata_item.get("name"),
                                                                      type_id=metadata_item.get("type_id"))
                        content.metadata.add(obj)
                    content.save()
            data = {
                'result': 'success',
            }
            return data

        except Exception as e:
            data = {
                'result': 'error',
                'error': str(e)
            }
            return data


class LibraryBuildUtil:

    def build_library(self, version_id):
        metadata_types = MetadataType.objects.all().values_list('id', 'name')
        metadata = Metadata.objects.filter(content__libraryfolder__version_id=version_id).values_list('id', 'name',
                                                                                                      'type_id').distinct('id')
        folders = LibraryFolder.objects.filter(version_id=version_id).values_list('id', 'folder_name',
                                                                                  'banner_img__image_file'
                                                                                  , 'logo_img__image_file', 'parent_id')
        contents = Content.objects.filter(libraryfolder__version_id=version_id).values_list('id', 'title', 'description'
                                                                                            , 'file_name',
                                                                                            'published_date',
                                                                                            'copyright',
                                                                                            'rights_statement',
                                                                                            'libraryfolder__id').distinct('id')
        contents_metadata = Content.metadata.through.objects.filter(content__libraryfolder__version_id=version_id)\
            .values_list('content_id', 'metadata_id')

        db_util = LibraryDbUtil(metadata_types, metadata, folders, contents, contents_metadata)
        db_util.create_library_db()
        return 'success'


