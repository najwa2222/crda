pipeline {
    agent any

    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-credentials')
    }

    stages {
        stage('Checkout') {
            steps {
                script {
                    // Ensure the repository URL is correct
                    def repoUrl = 'https://github.com/najwa2222/crda/api-gateway.git'
                    try {
                        git url: repoUrl
                    } catch (e) {
                        error "Failed to clone repository: ${repoUrl}"
                    }
                }
            }
        }

        stage('Build') {
            steps {
                script {
                    dockerImage = docker.build("najwakarrouchi968/api-gateway:latest")
                }
            }
        }

        stage('Build and Test Microservices') {
            parallel {
                stage('Build and Test Authentification') {
                    steps {
                        dir('authentification') {
                            script {
                                dockerImage = docker.build("najwakarrouchi968/authentification:latest")
                                dockerImage.inside {
                                    sh 'npm install'
                                    sh 'npm test'
                                }
                            }
                        }
                    }
                }
                stage('Build and Test Gestion Documents Service') {
                    steps {
                        dir('gestiondocuments') {
                            script {
                                dockerImage = docker.build("najwakarrouchi968/gestiondocuments:latest")
                                dockerImage.inside {
                                    sh 'npm install'
                                    sh 'npm test'
                                }
                            }
                        }
                    }
                }
                stage('Build and Test Enregistrement Service') {
                    steps {
                        dir('enregistrement') {
                            script {
                                dockerImage = docker.build("najwakarrouchi968/enregistrement:latest")
                                dockerImage.inside {
                                    sh 'npm install'
                                    sh 'npm test'
                                }
                            }
                        }
                    }
                }
                stage('Build and Test Controllers Service') {
                    steps {
                        dir('controllers') {
                            script {
                                dockerImage = docker.build("najwakarrouchi968/controllers:latest")
                                dockerImage.inside {
                                    sh 'npm install'
                                    sh 'npm test'
                                }
                            }
                        }
                    }
                }
                stage('Build and Test Notification Service') {
                    steps {
                        dir('notification') {
                            script {
                                dockerImage = docker.build("najwakarrouchi968/notification:latest")
                                dockerImage.inside {
                                    sh 'npm install'
                                    sh 'npm test'
                                }
                            }
                        }
                    }
                }
            }
        }

        stage('Push Microservices Images') {
            steps {
                script {
                    docker.withRegistry('https://registry.hub.docker.com', DOCKERHUB_CREDENTIALS) {
                        docker.image('najwakarrouchi968/authentification:latest').push()
                        docker.image('najwakarrouchi968/gestiondocuments:latest').push()
                        docker.image('najwakarrouchi968/enregistrement:latest').push()
                        docker.image('najwakarrouchi968/controllers:latest').push()
                        docker.image('najwakarrouchi968/notification:latest').push()
                    }
                }
            }
        }

        stage('Deploy Microservices') {
            steps {
                script {
                    sh 'kubectl apply -f kubernetes/deployment-api-gateway.yaml'
                    sh 'kubectl apply -f kubernetes/deployment-authentification.yaml'
                    sh 'kubectl apply -f kubernetes/deployment-gestiondocuments.yaml'
                    sh 'kubectl apply -f kubernetes/deployment-enregistrement.yaml'
                    sh 'kubectl apply -f kubernetes/deployment-controllers.yaml'
                    sh 'kubectl apply -f kubernetes/deployment-notification.yaml'
                }
            }
        }
    }
}
