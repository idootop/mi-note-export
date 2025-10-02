FROM lipanski/docker-static-website:latest AS runner

COPY ./dist .

EXPOSE 3000

CMD ["/busybox-httpd", "-f", "-v", "-p", "3000"]

