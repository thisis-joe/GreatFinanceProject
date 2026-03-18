#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

JAVA_CANDIDATES=(
  "/c/Program Files/Eclipse Adoptium/jdk-21.0.10.7-hotspot"
  "/c/Program Files/Java/jdk-21"
  "/c/Program Files/Eclipse Adoptium/jdk-21"
  "/c/Program Files/Microsoft/jdk-21"
  "/c/Program Files/Zulu/zulu-21"
  "/mnt/c/Program Files/Eclipse Adoptium/jdk-21.0.10.7-hotspot"
  "/mnt/c/Program Files/Java/jdk-21"
  "/mnt/c/Program Files/Eclipse Adoptium/jdk-21"
  "/mnt/c/Program Files/Microsoft/jdk-21"
  "/mnt/c/Program Files/Zulu/zulu-21"
)

JAVA_HOME_FOUND=""
for candidate in "${JAVA_CANDIDATES[@]}"; do
  if [ -x "$candidate/bin/java" ] || [ -x "$candidate/bin/java.exe" ]; then
    JAVA_HOME_FOUND="$candidate"
    break
  fi
done

if [ -z "$JAVA_HOME_FOUND" ]; then
  echo "JDK 21 was not found."
  echo "Install JDK 21, then update JAVA_CANDIDATES in run.sh if your install path differs."
  exit 1
fi

export JAVA_HOME="$JAVA_HOME_FOUND"
export PATH="$JAVA_HOME/bin:$PATH"

echo "Using JAVA_HOME=$JAVA_HOME"
java -version
javac -version

cd "$SCRIPT_DIR"
./mvnw spring-boot:run
