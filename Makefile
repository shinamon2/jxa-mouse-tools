# ==========================================
# jxa-mouse-tools Makefile
#
# JXA (.js) を Script Editor 形式 (.scpt) にコンパイルし、
# dist/scpt/ へ集約する。
#
# 使い方:
#   make                       (= make build)
#   make build                 scripts/mouse/*.js → dist/scpt/*.scpt
#                              完了後に Finder で dist/scpt を自動で開く
#   make clean                 dist/scpt 配下の .scpt を削除
#   make open                  dist/scpt を Finder で開く
#   make run TOOL=<name>       dist/scpt/<name>.scpt を Script Editor で開く
#                              例: make run TOOL=coordinate_inspector
#   make help                  ターゲット一覧
# ==========================================

SRC_DIR    := scripts/mouse
DIST_DIR   := dist/scpt
JS_FILES   := $(wildcard $(SRC_DIR)/*.js)
SCPT_FILES := $(patsubst $(SRC_DIR)/%.js,$(DIST_DIR)/%.scpt,$(JS_FILES))

OSACOMPILE := osacompile -l JavaScript

.PHONY: all build clean open run help

all: build

# .js → .scpt をビルドし、結果を一覧表示後に Finder で開く
build: $(SCPT_FILES)
	@echo ""
	@echo "===== 生成された .scpt ====="
	@ls -1 $(DIST_DIR)/*.scpt 2>/dev/null || echo "(生成物なし)"
	@echo "============================"
	@open $(DIST_DIR)

# パターンルール: scripts/mouse/foo.js → dist/scpt/foo.scpt
$(DIST_DIR)/%.scpt: $(SRC_DIR)/%.js | $(DIST_DIR)
	$(OSACOMPILE) -o $@ $<

# 出力先ディレクトリの自動作成 (order-only prerequisite)
$(DIST_DIR):
	mkdir -p $(DIST_DIR)

# 生成物の削除 (dist/scpt ディレクトリ自体は残す)
clean:
	rm -f $(DIST_DIR)/*.scpt

# 既存ビルド物を Finder で開く
open:
	@test -d $(DIST_DIR) || (echo "$(DIST_DIR) が存在しません。先に 'make build' を実行してください。" && exit 1)
	@open $(DIST_DIR)

# 指定ツールの .scpt を Script Editor で開く
# 例: make run TOOL=coordinate_inspector
run:
	@if [ -z "$(TOOL)" ]; then \
		echo "使い方: make run TOOL=<name>"; \
		echo "例:    make run TOOL=coordinate_inspector"; \
		echo ""; \
		echo "利用可能なツール:"; \
		for f in $(SRC_DIR)/*.js; do \
			[ -f "$$f" ] || continue; \
			echo "  - $$(basename $$f .js)"; \
		done; \
		exit 1; \
	fi
	@test -f $(DIST_DIR)/$(TOOL).scpt || (echo "$(DIST_DIR)/$(TOOL).scpt が見つかりません。先に 'make build' を実行してください。" && exit 1)
	@open $(DIST_DIR)/$(TOOL).scpt

help:
	@echo "Targets:"
	@echo "  make build              -- scripts/mouse/*.js を dist/scpt/*.scpt にビルドし、Finder で開く"
	@echo "  make clean              -- dist/scpt の .scpt を削除"
	@echo "  make open               -- dist/scpt を Finder で開く"
	@echo "  make run TOOL=<name>    -- dist/scpt/<name>.scpt を Script Editor で開く"
	@echo "                             例: make run TOOL=coordinate_inspector"
	@echo "  make help               -- このヘルプを表示"
