FROM node:22-alpine

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package*.json ./
RUN npm install

# Copy the rest of the frontend source
COPY . .

EXPOSE 3000

ENV NODE_ENV=development
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["npm", "run", "dev"]

