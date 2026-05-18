# Tomcat 9.0.x with Apache Fortress REST + Web WARs and the Fortress Realm
# wired up. JDK 8 because Fortress 2.0.x is on the javax.* / Java 8 line.
FROM tomcat:9.0.96-jdk8-temurin

ARG FORTRESS_VERSION=2.0.7
ENV FORTRESS_VERSION=${FORTRESS_VERSION}

WORKDIR /tmp/fortress

RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/* \
    && curl -fsSL "https://archive.apache.org/dist/directory/fortress/dist/${FORTRESS_VERSION}/fortress-rest-${FORTRESS_VERSION}.war" \
       -o "${CATALINA_HOME}/webapps/fortress-rest.war" \
    && curl -fsSL "https://archive.apache.org/dist/directory/fortress/dist/${FORTRESS_VERSION}/fortress-web-${FORTRESS_VERSION}.war" \
       -o "${CATALINA_HOME}/webapps/fortress-web.war" \
    && curl -fsSL "https://archive.apache.org/dist/directory/fortress/dist/${FORTRESS_VERSION}/fortress-realm-proxy-${FORTRESS_VERSION}.jar" \
       -o "${CATALINA_HOME}/lib/fortress-realm-proxy.jar"

# Tomcat manager users (matches the legacy guide). Manager webapp itself
# isn't enabled here — we ship WARs directly into webapps/.
COPY tomcat-users.xml ${CATALINA_HOME}/conf/tomcat-users.xml

ENV JAVA_OPTS="-Dfortress.admin.user=uid=admin,ou=system \
               -Dfortress.admin.pw=secret \
               -Dfortress.config.root=ou=Config,dc=example,dc=com \
               -Dfortress.host=archnav-apacheds \
               -Dfortress.port=10389"

EXPOSE 8080
