# Build stage
FROM node:20-alpine as build
WORKDIR /app
COPY . .

RUN npm install -g @angular/cli
RUN npm install

RUN ng build --configuration=production

# ✅ Sichtprüfung Build-Inhalt
RUN ls -la /app/dist/rollplusplus-frontend

# Serve stage
FROM nginx:alpine
COPY --from=build /app/dist/rollplusplus-frontend/browser /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
