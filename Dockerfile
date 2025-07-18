FROM registry.access.redhat.com/ubi9/nodejs-20:latest AS build
USER root

ADD . /usr/src/app
WORKDIR /usr/src/app
RUN npm install --omit dev --loglevel verbose
RUN npm run build --loglevel verbose

FROM registry.access.redhat.com/ubi9/nginx-124:latest
USER 0
COPY --from=build /usr/src/app/dist /usr/share/nginx/html
RUN mkdir -p /licenses
COPY --from=build /usr/src/app/LICENSE /licenses/LICENSE
LABEL name="openshift-lightspeed/lightspeed-console" \
      com.redhat.component="openshift-lightspeed" \
      io.k8s.display-name="OpenShift Lightspeed Console" \
      summary="OpenShift Lightspeed Console provides OCP console plugin for OpenShift Lightspeed Service" \
      description="OpenShift Lightspeed Console provides OCP console plugin for OpenShift Lightspeed Service" \
      io.k8s.description="OpenShift Lightspeed Console is a component of OpenShift Lightspeed" \
      io.openshift.tags="openshift-lightspeed,ols"
USER 1001

ENTRYPOINT ["nginx", "-g", "daemon off;", "-e", "stderr"]
