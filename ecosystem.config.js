module.exports = {
    apps: [
        {
            name: 'johnchen0213-server',
            port: 12011,
            script: './dist/server.js',
            args: 'start',
            env: {
                NODE_ENV: 'production',
            },
        },
    ],
}; 