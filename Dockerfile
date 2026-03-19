FROM node:18

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the Prisma client
RUN npx prisma generate

# Expose the application port
EXPOSE 3000

# Command to run the application
CMD ["node", "src/app.js"]