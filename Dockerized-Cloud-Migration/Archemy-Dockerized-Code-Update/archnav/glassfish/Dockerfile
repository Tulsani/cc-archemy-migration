# GlassFish 4.1.2 + ADF Essentials 12.2.1.3 + MySQL Connector/J 8.x.
#
# GlassFish 4.1.2 ships JSF 2.2 natively (which ADF Essentials 12.2.1.3
# requires) — Oracle never certified ADF Essentials on GlassFish 5 / JSF 2.3.
#
# ADF Essentials JARs must be supplied pre-extracted in adf-essentials-part1/
# and adf-essentials-part2/ (the eDelivery V996783-01 + V996784-01 layout).
FROM eclipse-temurin:8u432-b06-jdk-jammy

ARG GLASSFISH_URL=https://download.oracle.com/glassfish/4.1.2/release/glassfish-4.1.2.zip
ARG MYSQL_CONNECTOR_VERSION=8.4.0

ENV GLASSFISH_HOME=/opt/glassfish4
ENV PATH=${GLASSFISH_HOME}/bin:${PATH}

RUN apt-get update && apt-get install -y --no-install-recommends \
        curl unzip zip ca-certificates python3 \
    && rm -rf /var/lib/apt/lists/*

# Install GlassFish 5.0.0
RUN curl -fsSL "${GLASSFISH_URL}" -o /tmp/glassfish.zip \
    && unzip -q /tmp/glassfish.zip -d /opt/ \
    && rm /tmp/glassfish.zip \
    && chmod +x ${GLASSFISH_HOME}/bin/asadmin

# Drop in MySQL Connector/J 8.x (the legacy guide used 5.1.47; modernized).
RUN curl -fsSL "https://repo1.maven.org/maven2/com/mysql/mysql-connector-j/${MYSQL_CONNECTOR_VERSION}/mysql-connector-j-${MYSQL_CONNECTOR_VERSION}.jar" \
    -o ${GLASSFISH_HOME}/glassfish/domains/domain1/lib/mysql-connector-j.jar


# Install ADF Essentials 12.2.1.3 — Oracle eDelivery parts:
#   V996783-01 (part1) + V996784-01 (part2) = ADF Essentials runtime
#   V996774-01 (part3) = oracle_common (adf-share-base.jar, ADFLogger, MDS, JRF, ODL)
# All three are required: part3's adf-share-base.jar carries oracle.adf.share.logging.ADFLogger
# which the EAR's faces-config references.
COPY adf-essentials-part1 /tmp/adf-essentials/part1
COPY adf-essentials-part2 /tmp/adf-essentials/part2
COPY adf-essentials-part3 /tmp/adf-essentials/part3
RUN find /tmp/adf-essentials -name '*.jar' -exec cp -n {} ${GLASSFISH_HOME}/glassfish/domains/domain1/lib/ \; \
    && rm -rf /tmp/adf-essentials

# Apply ADF JVM flags + JDBC pool/resource + port shift (8080 -> 9999).
COPY post-install.asadmin /tmp/post-install.asadmin

RUN ${GLASSFISH_HOME}/bin/asadmin start-domain domain1 \
    && ${GLASSFISH_HOME}/bin/asadmin --user admin multimode --file /tmp/post-install.asadmin \
    && ${GLASSFISH_HOME}/bin/asadmin stop-domain domain1 \
    && rm /tmp/post-install.asadmin

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 9999 4848

ENTRYPOINT ["/entrypoint.sh"]
