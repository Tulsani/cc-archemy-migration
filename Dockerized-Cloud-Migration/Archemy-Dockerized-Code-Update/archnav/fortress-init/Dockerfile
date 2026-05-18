# One-shot container that builds Apache Fortress core 2.0.7 and loads its
# baseline data + the fortress-web demo users into the ApacheDS partition.
# Runs `mvn install -Dload.file=...` for refreshLDAPData.xml,
# DelegatedAdminManagerLoad.xml, and FortressWebDemoUsers.xml (extracted
# from the fortress-web source release), then exits.
#
# Why pre-substitute config/bootstrap/fortress.properties:
#   The fortress-load Ant target forks a JVM with the source-tree
#   `config/bootstrap/` directory FIRST on the classpath. That copy
#   never goes through Maven's filtering, so ${ldap.host} etc. remain
#   literal at runtime and Fortress can't connect. We rewrite the file
#   in-place once at build time so every subsequent `mvn install
#   -Dload.file=...` call sees real values.
FROM maven:3.9-eclipse-temurin-8

ARG FORTRESS_VERSION=2.0.7
ENV FORTRESS_VERSION=${FORTRESS_VERSION}

WORKDIR /work

RUN apt-get update && apt-get install -y --no-install-recommends curl unzip \
    && rm -rf /var/lib/apt/lists/* \
    && curl -fsSL "https://archive.apache.org/dist/directory/fortress/dist/${FORTRESS_VERSION}/fortress-core-${FORTRESS_VERSION}-source-release.zip" -o fortress-core.zip \
    && unzip -q fortress-core.zip \
    && rm fortress-core.zip \
    && mv "fortress-core-${FORTRESS_VERSION}" fortress-core \
    && curl -fsSL "https://archive.apache.org/dist/directory/fortress/dist/${FORTRESS_VERSION}/fortress-web-${FORTRESS_VERSION}-source-release.zip" -o fortress-web.zip \
    && unzip -q fortress-web.zip "fortress-web-${FORTRESS_VERSION}/src/main/resources/FortressWebDemoUsers.xml" \
    && cp "fortress-web-${FORTRESS_VERSION}/src/main/resources/FortressWebDemoUsers.xml" /work/fortress-core/FortressWebDemoUsers.xml \
    && rm -rf fortress-web.zip "fortress-web-${FORTRESS_VERSION}"

WORKDIR /work/fortress-core

COPY build.properties ./

# Pre-substitute the bootstrap config the load JVM actually reads.
RUN sed -i \
        -e 's|${ldap.host}|archnav-apacheds|g' \
        -e 's|${ldap.port}|10389|g' \
        -e 's|${suffix}|dc=example,dc=com|g' \
        -e 's|${root.dn}|uid=admin,ou=system|g' \
        -e 's|${cfg.root.pw}|secret|g' \
        -e 's|${cfg.root.dn}|uid=admin,ou=system|g' \
        config/bootstrap/fortress.properties \
    && grep -E '^(host|port|admin\.user|admin\.pw|config\.root)=' config/bootstrap/fortress.properties

# The fortress-load Ant target reads load XMLs as Ant buildfiles. The XMLs use
# ${suffix}, ${users.dn}, etc. Ant doesn't auto-load build.properties and the
# load profile only forwards `version`/`tenant` as sysproperties — so we inject
# `<property file="build.properties"/>` right after the opening <project> tag.
RUN for f in ldap/setup/refreshLDAPData.xml ldap/setup/DelegatedAdminManagerLoad.xml FortressWebDemoUsers.xml; do \
        sed -i '0,/<project /{s|<project \([^>]*\)>|<project \1>\n    <property file="build.properties"/>|}' "$f"; \
    done

# ArchNav app users are still added manually via Fortress Web
# (http://localhost:8080/fortress-web). FortressWebDemoUsers.xml gives us
# the seeded users we need to log into Fortress Web in the first place
# (most notable: `test` / `password`).
CMD ["sh", "-c", "set -u; \
  echo '== building fortress-core =='; \
  mvn -B -q install -DskipTests; \
  echo '== loading refreshLDAPData.xml =='; \
  mvn -B -q install -Dload.file=./ldap/setup/refreshLDAPData.xml || echo '(refresh load reported errors — likely idempotent re-run; continuing)'; \
  echo '== loading DelegatedAdminManagerLoad.xml =='; \
  mvn -B -q install -Dload.file=./ldap/setup/DelegatedAdminManagerLoad.xml || echo '(delegated load reported errors — likely idempotent re-run; continuing)'; \
  echo '== loading FortressWebDemoUsers.xml =='; \
  mvn -B -q install -Dload.file=./FortressWebDemoUsers.xml || echo '(demo-users load reported errors — likely idempotent re-run; continuing)'; \
  echo '== fortress LDAP bootstrap complete =='"]
