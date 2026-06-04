module.exports = {
    apps: [
        {
            name: 'Pet_Sitter_server-server',
            script: './dist/server.js',
            args: 'start',
            env: {
                NODE_ENV: 'production',
            },
        },
    ],
}; 