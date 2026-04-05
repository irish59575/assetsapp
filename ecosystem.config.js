module.exports = {
  apps: [
    {
      name: "assettracker-web",
      cwd: "./web",
      script: "node_modules/next/dist/bin/next",
      args: "start -H 0.0.0.0",
      interpreter: "node",
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: "3000",
      },
    },
    {
      name: "assettracker-api",
      cwd: "./backend",
      script: "C:\\Users\\annmarie.sexton\\AppData\\Local\\Programs\\Python\\Python313\\python.exe",
      args: "-m uvicorn app.main:app --host 127.0.0.1 --port 8000",
      interpreter: "none",
      watch: false,
    },
  ],
};
