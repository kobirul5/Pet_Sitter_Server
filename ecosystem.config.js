module.exports = {
    apps: [
        {
            name: 'freashstart-server',
            script: './dist/server.js',
            args: 'start',
            env: {
                NODE_ENV: 'production',
            },
        },
    ],
}; 