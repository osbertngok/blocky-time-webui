override PROJECT = $(shell git config remote.origin.url | xargs basename | cut -d '.' -f1)
override HEAD = $(shell git rev-parse HEAD)

PYTHON_PACKAGES ?= blockytime
APP_NAME ?= blockytime
PYTHON_VERSION ?= 3.13

# Determine OS. Currently only support Mac.
UNAME_S := $(shell uname -s | tr -d '\n\r\t ') # FIXME: This may fail on Windows

# Detect uv
UV := $(shell which uv 2>/dev/null)
ifndef UV
    $(error uv is not installed. Install it from https://docs.astral.sh/uv/getting-started/installation/)
endif

override FLASK_SECRET_KEY = $(shell cat .env 2>/dev/null | grep FLASK_SECRET_KEY | cut -d '=' -f2)
override BLOCKYTIME_SERVER_PORT = $(shell cat .env 2>/dev/null | grep BLOCKYTIME_SERVER_PORT | cut -d '=' -f2 | grep . || echo 5002)

define TEST_LIST_SCRIPT
from testblockytime import test_blockservice, test_typeservice
import inspect
for module in [test_blockservice, test_typeservice]:
    for classname, classobj in inspect.getmembers(module):
        if classname.startswith("Test"):
            for name, obj in inspect.getmembers(classobj):
                if name.startswith("test_"):
                    print(f"make test TESTFILE={module.__name__.split('.')[-1]}.py TESTNAME={classname}::{name}")
endef
export TEST_LIST_SCRIPT


.PHONY: all
all: usage

.PHONY: help
help: usage

.PHONY: usage
usage: check-os
	@echo "\033[1m\033[93mBuild System\033[0m"
	@echo
	@echo "\033[93mFrequently used workflow\033[0m"
	@echo
	@echo "    make build"
	@echo "        \033[90m- build site directory\033[0m"
	@echo
	@echo "    make clean"
	@echo "        \033[90m- remove built files under .ve3 folder\033[0m"
	@echo
	@echo "    make run"
	@echo "        \033[90m- run server \033[0m"
	@echo
	@echo "    make test-list"
	@echo "        \033[90m- list all available tests \033[0m"
	@echo
	@echo "    make test"
	@echo "        \033[90m- try a specific test \033[0m"
	@echo
	@echo "    make pull-db"
	@echo "        \033[90m- pull DB.db from USB-connected iPhone \033[0m"
	@echo
	@echo "    make push-db"
	@echo "        \033[90m- push local DB.db to USB-connected iPhone (backs up iPhone DB first) \033[0m"
	@echo
	@echo "    make ai-tools ARGS=\"<command> [flags]\""
	@echo "        \033[90m- run AI-callable CLI tools (get-types, get-projects, get-blocks, set-blocks, ...) \033[0m"
	@echo "        \033[90m  run with ARGS=\"list-commands\" to see all available commands \033[0m"
	@echo
	@echo "    make python"
	@echo "        \033[90m- run python3 repl \033[0m"
	@echo
	@echo "\033[95mConstants\033[0m"
	@echo "\033[90m"
	@echo "    PROJECT=\"${PROJECT}\" # project name"
	@echo "    HEAD=\"${HEAD}\" # git hash of repo"
	@echo "\033[0m"

.ve3/bin/python3:
	@echo "Creating virtual environment with uv (Python $(PYTHON_VERSION))..."
	@$(UV) venv .ve3 --python $(PYTHON_VERSION)

.PHONY: build-python-env
build-python-env: .ve3/bin/python3
	@$(UV) pip install -e ".[dev]" --python .ve3/bin/python3
	@PYTHON_VERSION=$$(.ve3/bin/python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")'); \
	mkdir -p .ve3/lib/python$$PYTHON_VERSION/site-packages; \
	echo "$(shell pwd)/python" > .ve3/lib/python$$PYTHON_VERSION/site-packages/on.pth


.PHONY: build
build: build-python-env


.PHONY: run
run:
	@echo "Running blockytime server on port ${BLOCKYTIME_SERVER_PORT}..."
	@FLASK_SECRET_KEY=${FLASK_SECRET_KEY} \
	BLOCKYTIME_SERVER_PORT=${BLOCKYTIME_SERVER_PORT} \
	.ve3/bin/python3 -m python.blockytime.server

.PHONY: clean
clean:
	@git clean -fX .ve3/

.PHONY: test-list
test-list:
	@echo "Try:"
	@echo
	@echo "$$TEST_LIST_SCRIPT" | ./.ve3/bin/python3

.PHONY: test
test:
ifeq (${TESTFILE},)
	TESTFILE=test_blockservice.py
endif

ifeq (${TESTNAME},)
	@.ve3/bin/python3 -m pytest -s python/testblockytime/${TESTFILE}
else
	@.ve3/bin/python3 -m pytest -s python/testblockytime/${TESTFILE}::${TESTNAME}
endif

.PHONY: check
check: check-mypy-py3

.PHONY: check-mypy-py3
check-mypy-py3:
	@.ve3/bin/python3 -m mypy

.PHONY: lint
lint:
	@.ve3/bin/python3 -m autoflake --in-place --recursive --remove-all-unused-imports python/
	@.ve3/bin/python3 -m isort python/
	@.ve3/bin/python3 -m black python/

.PHONY: python
python:
	@.ve3/bin/python3

.PHONY: check-os
check-os:
ifeq ($(strip $(UNAME_S)),Darwin)
	@echo "Running on macOS - supported"
else
	@echo "Warning: This Makefile is optimized for macOS. Current OS is $(strip $(UNAME_S))"
endif

# Default to project's dynamic data directory
export BLOCKYTIME_DATA_PATH ?= $(PWD)/python/blockytime/data

.PHONY: pull-db
pull-db:
	@.ve3/bin/python3 -m python.blockytime.scripts.pull_db

.PHONY: push-db
push-db:
	@.ve3/bin/python3 -m python.blockytime.scripts.push_db

# AI tool CLI — pass ARGS="<command> [flags]", e.g. make ai-tools ARGS="get-types"
# Run without ARGS to see usage.
.PHONY: ai-tools
ai-tools:
	@.ve3/bin/python3 -m python.blockytime.scripts.ai_tools $(ARGS)

.PHONY: fe-install
fe-install:
	@cd typescript/v1/blockytime-app && npm install

.PHONY: fe-build
fe-build:
	@cd typescript/v1/blockytime-app && npm run build

.PHONY: fe-dev
fe-dev:
	@cd typescript/v1/blockytime-app && npm run dev

.PHONY: fe-scss
fe-scss:
	@cd typescript/v1/blockytime-app && npm run watch-scss

.PHONY: fe-lint
fe-lint:
	@cd typescript/v1/blockytime-app && npm run check
	@cd typescript/v1/blockytime-app && npm run lint
