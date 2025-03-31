CREATE TABLE IF NOT EXISTS "Block" (
	"uid"	integer NOT NULL,
	"date"	date,
	"type_uid"	integer DEFAULT 0,
	"project_uid"	integer DEFAULT 0,
	"comment"	text DEFAULT '',
	PRIMARY KEY("uid" AUTOINCREMENT)
);
CREATE TABLE IF NOT EXISTS "Category" (
	"uid"	integer NOT NULL,
	"name"	text DEFAULT '',
	PRIMARY KEY("uid" AUTOINCREMENT)
);
CREATE TABLE IF NOT EXISTS "Config" (
	"key"	text DEFAULT '',
	"value"	text DEFAULT ''
);
CREATE TABLE IF NOT EXISTS "DBinfo" (
	"version"	integer,
	"info"	string
);
CREATE TABLE IF NOT EXISTS "Goal" (
	"uid"	integer NOT NULL,
	"type"	integer NOT NULL DEFAULT 0,
	"hours"	float,
	"duration_type"	integer,
	"attr_uid"	integer,
	"type_uid"	integer,
	"project_uid"	integer,
	"start_date"	integer,
	"end_date"	integer,
	"comment"	text,
	"remind_policy"	integer,
	"state"	integer,
	"fav"	bool,
	"priority"	integer,
	"ext_i"	integer,
	"ext_t"	text,
	PRIMARY KEY("uid" AUTOINCREMENT)
);
CREATE TABLE IF NOT EXISTS "Link" (
	"type_uid"	integer NOT NULL,
	"project_uid"	integer NOT NULL
);
CREATE TABLE IF NOT EXISTS "Project" (
	"uid"	integer NOT NULL,
	"name"	text DEFAULT '',
	"abbr"	text DEFAULT '',
	"latin"	text DEFAULT '',
	"acronym"	text DEFAULT '',
	"hidden"	bool,
	"classify_uid"	integer DEFAULT 0,
	"taglist"	text DEFAULT '',
	"priority"	integer,
	PRIMARY KEY("uid" AUTOINCREMENT)
);
CREATE TABLE IF NOT EXISTS "Remind" (
	"uid"	integer NOT NULL,
	"key"	text NOT NULL DEFAULT '',
	"block_date"	integer,
	"alert_type"	integer,
	"alert_offset"	integer,
	"ring_index"	integer,
	"alert_msg"	text DEFAULT '',
	"type_uid"	integer,
	"project_uid"	integer,
	"place_uid"	integer,
	"person_uids"	varchar,
	"comment"	text,
	"repeat"	integer,
	"state"	bool,
	"ext_i"	integer,
	"ext_t"	text DEFAULT '',
	"ext_d"	double,
	PRIMARY KEY("uid" AUTOINCREMENT)
);
CREATE TABLE IF NOT EXISTS "Stamp" (
	"uid"	integer NOT NULL,
	"stamper_uid"	integer,
	"interval"	double,
	"block_data"	blob,
	"reminds"	text,
	"timestamp"	date,
	"ext_i"	integer,
	"ext_t"	text,
	PRIMARY KEY("uid" AUTOINCREMENT)
);
CREATE TABLE IF NOT EXISTS "Stamper" (
	"uid"	integer NOT NULL,
	"name"	text NOT NULL DEFAULT '',
	"color"	integer,
	"fav"	bool,
	"priority"	integer,
	"timestamp"	date,
	"sub_uids"	text,
	"group_number"	integer,
	"group_name"	text,
	"ext_i"	integer,
	"ext_t"	text,
	PRIMARY KEY("uid" AUTOINCREMENT)
);
CREATE TABLE IF NOT EXISTS "TrendHistory" (
	"uid"	integer NOT NULL,
	"target"	integer NOT NULL,
	"target_ids"	text DEFAULT '',
	PRIMARY KEY("uid" AUTOINCREMENT)
);
CREATE TABLE IF NOT EXISTS "Type" (
	"uid"	integer NOT NULL,
	"category_uid"	integer DEFAULT 0,
	"name"	text DEFAULT '',
	"color"	integer,
	"hidden"	bool,
	"priority"	integer,
	PRIMARY KEY("uid" AUTOINCREMENT)
);