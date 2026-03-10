FROM node:20-alpine

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package*.json ./
RUN npm install

# Copy the rest of the backend source
COPY . .

EXPOSE 4000

ENV NODE_ENV=development
ENV PORT=4000

CMD ["npm", "run", "dev"]

