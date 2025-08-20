module.exports = {
    apps: [
        {
            name: 'johnchen0213-server',
            script: './dist/server.js',
            args: 'start',
            env: {
                NODE_ENV: 'production',
            },
        },
    ],
}; 