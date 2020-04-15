import os
import sqlite3
from sqlite3 import Error

from dlms import settings


class LibraryDbUtil:

    def __init__(self, metadata_types, metadata, folders, contents, contents_metadata):
        self.metadata_types = metadata_types
        self.metadata = metadata
        self.folders = folders
        self.contents = contents
        self.contents_metadata = contents_metadata

    def create_connection(self, db_file):
        """ create a database connection to the SQLite database
            specified by db_file
        :param db_file: database file
        :return: Connection object or None
        """
        conn = None
        try:
            conn = sqlite3.connect(db_file)
            return conn
        except Error as e:
            print(e)

        return conn

    def create_table(self, conn, create_table_sql):
        """ create a table from the create_table_sql statement
        :param conn: Connection object
        :param create_table_sql: a CREATE TABLE statement
        :return:
        """
        try:
            c = conn.cursor()
            c.execute(create_table_sql)
        except Error as e:
            print(e)

    def insert_data(self, conn):
        """ insert bulk data from DLMS to sqlite
        :param conn: Connection object
        :return:
        """
        try:
            c = conn.cursor()
            c.executemany('INSERT INTO metadata_type VALUES (?,?)', self.metadata_types)
            c.executemany('INSERT INTO metadata VALUES (?,?,?)', self.metadata)
            c.executemany('INSERT INTO folder VALUES (?,?,?,?,?)', self.folders)
            c.executemany('INSERT INTO content VALUES (?,?,?,?,?,?,?,?)', self.contents)
            c.executemany('INSERT INTO content_metadata VALUES (?,?)', self.contents_metadata)
        except Error as e:
            print(e)

    def create_library_db(self):
        database = os.path.join(os.path.abspath(settings.BUILDS_ROOT), 'solarspell.db')
        sql_create_metadata_type_table = """CREATE TABLE IF NOT EXISTS metadata_type (
                                        id INTEGER PRIMARY KEY,
                                        type_name TEXT NOT NULL
                                    );"""
        sql_create_metadata_table = """CREATE TABLE IF NOT EXISTS metadata (
                                        id INTEGER PRIMARY KEY,
                                        meta_name TEXT NOT NULL,
                                        type_id INTEGER NOT NULL, 
                                        FOREIGN KEY (type_id) REFERENCES metadata_type (id)
                                    );"""
        sql_create_folder_table = """ CREATE TABLE IF NOT EXISTS folder (
                                            id INTEGER PRIMARY KEY,
                                            folder_name TEXT NOT NULL,
                                            banner TEXT,
                                            logo TEXT,
                                            parent_id INTEGER, 
                                            FOREIGN KEY (parent_id) REFERENCES folder (id)
                                        ); """
        sql_create_contents_table = """ CREATE TABLE IF NOT EXISTS content (
                                            id INTEGER PRIMARY KEY,
                                            title text NOT NULL,
                                            description TEXT,
                                            file_name TEXT,
                                            published_date TEXT,
                                            copyright TEXT,
                                            rights_statement TEXT,
                                            folder_id INTEGER NOT NULL,
                                            FOREIGN KEY (folder_id) REFERENCES folder (id)                             
                                        ); """
        sql_create_content_metadata_table = """ CREATE TABLE IF NOT EXISTS content_metadata (
                                               content_id INTEGER NOT NULL,
                                               metadata_id INTEGER NOT NULL,
                                               FOREIGN KEY (content_id) REFERENCES content (id)                                                               
                                               FOREIGN KEY (metadata_id) REFERENCES metadata (id)                             
                                           ); """

        # create a database connection
        conn = self.create_connection(database)

        if conn is not None:
            # create tables
            self.create_table(conn, sql_create_metadata_type_table)
            self.create_table(conn, sql_create_metadata_table)
            self.create_table(conn, sql_create_folder_table)
            self.create_table(conn, sql_create_contents_table)
            self.create_table(conn, sql_create_content_metadata_table)
            # insert data
            self.insert_data(conn)
            conn.commit()
        else:
            print("Error! cannot create the database connection.")
        conn.close()
