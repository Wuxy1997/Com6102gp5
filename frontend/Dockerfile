FROM node:18-alpine

WORKDIR /frontend

COPY package*.json ./

RUN npm install

COPY . .

# Debug commands
RUN echo "Current directory: $(pwd)"
RUN echo "Contents of /app:"
RUN ls -la
RUN echo "Contents of /app/src:"
RUN ls -la src
RUN echo "Contents of /app/src/pages:"
RUN ls -la src/pages

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"] 