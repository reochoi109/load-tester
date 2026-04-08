K6 ?= k6
# 실행 환경 선택: `make load ENV=prod`
ENV ?= staging
# 직접 경로 지정도 가능: `make load CONFIG=load-tester/config/env.staging.json`
CONFIG ?= load-tester/config/env.$(ENV).json
# 실행할 Flow 선택: `make load FLOW=post-read`
FLOW ?=
# k6 run에 추가로 넘길 옵션: `make load K6_ARGS="--no-thresholds"`
K6_ARGS ?=

K6_ENV_VARS := K6_ROOT=$(PWD) K6_CONFIG=$(CONFIG) FLOW=$(FLOW) APP_ENV=$(ENV)

.PHONY: help smoke regression load stress spike check-config

help:
	@echo "Usage:"
	@echo "  make load"
	@echo "  make load ENV=prod"
	@echo "  make load FLOW=post-read"
	@echo "  make load CONFIG=load-tester/config/env.staging.json"
	@echo "  make load K6_ARGS=\"--no-thresholds\""
	@echo ""
	@echo "Vars:"
	@echo "  ENV     = $(ENV)"
	@echo "  CONFIG  = $(CONFIG)"
	@echo "  FLOW    = $(FLOW)"
	@echo "  K6_ARGS = $(K6_ARGS)"

check-config:
	@test -f "$(CONFIG)" || (echo "Config file not found: $(CONFIG)"; exit 2)

smoke: check-config
	$(K6_ENV_VARS) $(K6) run $(K6_ARGS) load-tester/smoke-test.js

regression: check-config
	$(K6_ENV_VARS) $(K6) run $(K6_ARGS) load-tester/regression-test.js

load: check-config
	$(K6_ENV_VARS) $(K6) run $(K6_ARGS) load-tester/load-test.js

stress: check-config
	$(K6_ENV_VARS) $(K6) run $(K6_ARGS) load-tester/stress-test.js

spike: check-config
	$(K6_ENV_VARS) $(K6) run $(K6_ARGS) load-tester/spike-test.js
