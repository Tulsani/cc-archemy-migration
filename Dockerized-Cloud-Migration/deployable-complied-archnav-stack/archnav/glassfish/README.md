# GlassFish 4.1.2 + ADF Essentials image

Runs GlassFish 4.1.2 (last release with JSF 2.2) preloaded with Oracle ADF
Essentials 12.2.1.3 and an auto-patched `archemy.ear`.

## Required: three Oracle eDelivery parts

Oracle ADF Essentials 12.2.1.3 is shipped on eDelivery as three zips:

| Part | eDelivery filename | Contents |
|---|---|---|
| 1 | `V996783-01.zip` | `oracle.adf.model`, `oracle.adf.share`, `oracle.adf.glassfish` |
| 2 | `V996784-01.zip` | `oracle.adf.view`, `oracle.adf.controller`, `oracle.adf.pageflow` |
| 3 | `V996774-01.zip` | `oracle_common` — `adf-share-base.jar` (ADFLogger), MDS, JRF, ODL |

The standalone `adf-essentials.zip` from the OTN ADF Downloads page is **not
sufficient** on its own — it omits the `oracle_common` JARs that part 3
carries, and deploys fail with `NoClassDefFoundError: oracle.adf.share.logging.ADFLogger`.

Extract each zip and rename its top folder so the layout becomes:

```
archnav/glassfish/adf-essentials-part1/modules/...
archnav/glassfish/adf-essentials-part2/modules/...
archnav/glassfish/adf-essentials-part3/modules/...
```

The Dockerfile recursively copies every `*.jar` from all three folders into
`domain1/lib/` (≈150 JARs total, de-duplicated by `cp -n`).

## EAR patching

`entrypoint.sh` patches `archemy.ear` on container start by stripping three
WebLogic-only listeners from `WEB-INF/web.xml`:

- `oracle.bc4j.mbean.BC4JConfigLifeCycleCallBack`
- `oracle.adf.mbean.share.connection.ADFConnectionLifeCycleCallBack`
- `oracle.adf.mbean.share.config.ADFConfigLifeCycleCallBack`

The patched EAR lands in `domain1/autodeploy/` and GlassFish picks it up
automatically (~30 s after start).

## Build & run

```bash
cd archnav
docker compose build glassfish
docker compose up -d glassfish

# Wait for auto-deploy, then:
curl -I http://localhost:9999/archemy/faces/login.jspx     # → 200
```

## Why GlassFish 4.1.2, not 5

Oracle never certified ADF Essentials 12.2.1.3 on GlassFish 5. GF5 ships
Mojarra (JSF) 2.3, which breaks ADF's `ExceptionHandlerFactory` wiring. A
wholesale downgrade of `javax.faces.jar` further breaks GF5's HK2 dependency
graph and the web container won't start. 4.1.2 ships JSF 2.2 out of the box,
which is the version ADF Essentials targets.
