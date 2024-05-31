pipeline {
    agent any
    
    stages {
        stage('Build backend') {
            steps {
                script {
                    if (isUnix()) {
                        sh 'nohup docker build -t backend:latest -f Dockerfile.backend . &'
                    } else {
                        bat 'start /B docker build -t backend:latest -f Dockerfile.backend .'
                    }
                }
            }
        }
        stage('Build views') {
            steps {
                script {
                    if (isUnix()) {
                        sh 'nohup docker build -t views:latest -f Dockerfile.views . &'
                    } else {
                        bat 'start /B docker build -t views:latest -f Dockerfile.views .'
                    }
                }
            }
        }
        stage('Test') {
            steps {
                script {
                    if (isUnix()) {
                        sh 'nohup npm test &'
                    } else {
                        bat 'start /B npm test'
                    }
                }
            }
        }
        stage('Deploy') {
            steps {
                script {
                    if (isUnix()) {
                        sh 'nohup docker-compose up -d &'
                    } else {
                        bat 'start /B docker-compose up -d'
                    }
                }
            }
        }
    }
}
