override PROJECT = $(shell git config remote.origin.url | xargs basename | cut -d '.' -f1)
override HEAD = $(shell git rev-parse HEAD)

PYTHON_PACKAGES ?= blockytime
APP_NAME ?= blockytime

# Determine OS. Currently only support Mac.
UNAME_S := $(shell uname -s) # FIXME: This may fail on Windows

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


override MAKE = $(shell which make)
override PYTHON3 = $(shell which python3)
override GOOGLE_API_KEY = $(shell cat .env | grep GOOGLE_API_KEY | cut -d '=' -f2)
override FLASK_SECRET_KEY = $(shell cat .env | grep FLASK_SECRET_KEY | cut -d '=' -f2)
override BLOCKYTIME_SERVER_PORT = $(shell cat .env | grep BLOCKYTIME_SERVER_PORT | cut -d '=' -f2 | grep . || echo 5002)

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
	@echo "    make python"
	@echo "        \033[90m- run python3 repl \033[0m"
	@echo
	@echo "\033[95mConstants\033[0m"
	@echo "\033[90m"
	@echo "    PROJECT=\"${PROJECT}\" # project name"
	@echo "    HEAD=\"${HEAD}\" # git hash of repo"
	@echo "\033[0m"

.ve3/bin/python3:
	@if [ ! -x "/usr/local/bin/python3" ]; then \
		echo "Error: python3 not found in PATH"; \
		exit 1; \
	fi
	@echo "Found python3 at /usr/local/bin/python3"
	@mkdir -p .ve3/bin
	@ln -s /usr/local/bin/python3 .ve3/bin/python3

.ve3/bin/pip: .ve3/bin/python3
	@echo "Downloading pip..."
	@curl -sSf -o /tmp/get-pip.py https://bootstrap.pypa.io/get-pip.py && .ve3/bin/python3 /tmp/get-pip.py --trusted-host mirrors.aliyun.com
	@echo "Finished downloading pip."

.PHONY: build-python-env
build-python-env: .ve3/bin/pip
	@.ve3/bin/python3 -m pip install --trusted-host=mirrors.aliyun.com -e ".[dev]"
	@PYTHON_VERSION=$$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")'); \
	echo "$(shell pwd)/python" > .ve3/lib/python$$PYTHON_VERSION/site-packages/on.pth


.PHONY: build
build: build-python-env


.PHONY: run
run:
	@echo "Running blockytime server on port ${BLOCKYTIME_SERVER_PORT}..."
	@GOOGLE_API_KEY=${GOOGLE_API_KEY} \
	FLASK_SECRET_KEY=${FLASK_SECRET_KEY} \
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

.PHONY: python
python:
	@.ve3/bin/python3

.PHONY: check-os
check-os:
ifeq ($(UNAME_S),Darwin)
	$(error Cannot support non-MacOS. Current OS is $(UNAME_S))
endif
PYTHON3_LOCATION := /usr/local/bin/python3.12
ifeq ("$(wildcard $(PYTHON3_LOCATION))","")
    $(error Cannot find file $(PYTHON3_LOCATION))
endif

# Default to project's dynamic data directory
export BLOCKYTIME_DATA_PATH ?= $(PWD)/python/blockytime/data

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