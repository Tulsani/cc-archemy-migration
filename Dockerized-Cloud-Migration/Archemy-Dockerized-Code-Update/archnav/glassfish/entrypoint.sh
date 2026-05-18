#!/bin/bash
# Patch archemy.ear (strip WebLogic-only MBean listeners) and stage it for
# GlassFish auto-deploy, then hand off to asadmin.
#
# The EAR's WEB-INF/web.xml registers three listeners that only exist in the
# full WebLogic / oracle_common stack, not in ADF Essentials:
#   - oracle.bc4j.mbean.BC4JConfigLifeCycleCallBack
#   - oracle.adf.mbean.share.connection.ADFConnectionLifeCycleCallBack
#   - oracle.adf.mbean.share.config.ADFConfigLifeCycleCallBack
# Leaving them in causes "NoClassDefFoundError: ADFServletContextListenerAdapter"
# at deploy time. We strip every <listener> whose class is under *.mbean.*.

set -euo pipefail

SRC_EAR="/archives/archemy.ear"
AUTODEPLOY="${GLASSFISH_HOME}/glassfish/domains/domain1/autodeploy"
STAGE=/tmp/ear-patch

if [[ -f "$SRC_EAR" && ! -f "$AUTODEPLOY/archemy.ear" ]]; then
    echo "[entrypoint] patching $SRC_EAR -> $AUTODEPLOY/archemy.ear"
    rm -rf "$STAGE" && mkdir -p "$STAGE/ear"
    cd "$STAGE" && cp "$SRC_EAR" archemy.ear && unzip -o -q archemy.ear -d ear/
    cd ear && unzip -o -q Archemy_Project1_webapp.war -d war/ && rm Archemy_Project1_webapp.war
    python3 - <<'PY'
import re
p = 'war/WEB-INF/web.xml'
with open(p) as f: x = f.read()
x = re.sub(r'\s*<listener>\s*<listener-class>[^<]*\.mbean\.[^<]*</listener-class>\s*</listener>', '', x, flags=re.DOTALL)
with open(p,'w') as f: f.write(x)
PY
    (cd war && zip -q -r ../Archemy_Project1_webapp.war .) && rm -rf war
    zip -q -r "$AUTODEPLOY/archemy.ear" .
    cd / && rm -rf "$STAGE"
    echo "[entrypoint] patched EAR staged for autodeploy"
fi

exec asadmin start-domain --verbose domain1
