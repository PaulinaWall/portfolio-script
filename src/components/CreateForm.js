import React, { useState, useEffect } from 'react';
import { Button, Container, Alert, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router';

import ProjectForm from './common/ProjectForm';
import AboutForm from './common/AboutForm';
import LinksForm from './common/LinksForm';
import { db, storage } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import ProjectCard from './common/ProjectCard';
import About from './common/About';

import useGetPortfolio from '../hooks/useGetPortfolio';

const CreateForm = () => {
	const [error, setError] = useState(false)
	const [loading, setLoading] = useState(false)
	const [isSaved, setIsSaved] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(null);
	const [portfolioId, setPortfolioId] = useState(null);
	
	const { portfolio } = useGetPortfolio();
	const [uploadedImageUrl, setUploadedImageUrl] = useState(null);
	const [projectTitle, setProjectTitle] = useState('');
	const [projectText, setProjectText] = useState('');
	const [projectUrl, setProjectUrl] = useState('');
	const [projectImage, setProjectImage] = useState('');
	const [projectObjects, setProjectObjects] = useState([]);

	const [aboutTitle, setAboutTitle] = useState('');
	const [aboutText, setAboutText] = useState('');
	const [aboutUrl, setAboutUrl] = useState('');
	const [aboutObjects, setAboutObjects] = useState([]);

	const [gitHubUrl, setGithubUrl] = useState(null);
	const [linkedinUrl, setLinkedinUrl] = useState(null);
	const [facebookUrl, setFacebookUrl] = useState(null);

	const { currentUser } = useAuth();
	const navigate = useNavigate();

	useEffect(() => {
		console.log(portfolio, 'portfolio')

		const newPortfolio = {
			owner: currentUser.uid,
			about: [],
			projects: [],
			links: {},
		}

		db.collection("portfolios").add( newPortfolio )
		.then(docRef => {
			console.log('started portfolio', newPortfolio)
			setPortfolioId(docRef.id)
		})
		.catch((e) => {
			setError(e.message);
		})
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const addImageToStorage = (image) => {
		if(!image) {
			return;
		};
		const storageRef = storage.ref();

		//TODO We can add a folder for every owner in firebase and send to right owner folder `${owner.id}/${image.name}`
		const fileRef = storageRef.child(image.name);
		
		const uploadTask = fileRef.put(image);

		uploadTask.on('state_changed', taskSnapshot => {
			setUploadProgress(Math.round(
				(taskSnapshot.bytesTransferred / taskSnapshot.totalBytes) * 100));
		});

		uploadTask.then(snapshot => {
			snapshot.ref.getDownloadURL().then(url => {
				setUploadedImageUrl(url);
				setProjectImage({
					name: image.name,
					size: image.size,
					type: image.type,
					path: snapshot.ref.fullPath,
					url,
				});
				setUploadProgress(null);
			});
		}).catch(error => {
			setError(error.message)
		});
		console.log("uploadTask:", uploadTask);
	};

	const setPortfolioContent = () => {
		db.collection('portfolios').doc(portfolioId).get()
        .then((snapshot) => {
				const data = {
					title: projectTitle,
					image: projectImage,
					projectUrl: projectUrl,
					text: projectText,
				}
				const projects = snapshot.data().projects;
				projects.push(data);

			db.collection('portfolios').doc(portfolioId).set({
				projects: projects,
			}, { merge: true })
			.then(() => {
				console.log('updated projects with:', data)
			})
			.catch(() => {
				this.setState({
					errorMsg: true,
				})
			})

		}).catch(() => {
			this.setState({
				errorMsg: true,
			})
		})
	}

	const handleSaveOnClick = (e) => {
		if (e.target.innerHTML === 'Save Project') {
			console.log('portfolio in save click', portfolio)
			if(projectText.length > 50) {
				return;
			}
			setProjectObjects([
				...projectObjects,
				{
					title: projectTitle,
					image: projectImage,
					projectUrl: projectUrl,
					text: projectText,
				}
			]);

			setProjectTitle('');
			setUploadedImageUrl(null);
			setProjectUrl('');
			setProjectText('');
			console.log('projectObject', projectObjects)
			setPortfolioContent('project');
		}

		if( e.target.innerHTML === 'Save Section') {
			setIsSaved(true);
			setAboutObjects([
				...aboutObjects,
				{
					title: aboutTitle,
					text: aboutText,
					url: aboutUrl,
				}
			]);

			setAboutTitle('');
			setAboutText('');
			setAboutUrl('');

			setPortfolioContent('about');
		}
	}

	const handleImageChange = (e) => {
		addImageToStorage(e.target.files[0]);
	};

	return ( 
		<>
			{error && 
				(<Alert variant="danger">{error}</Alert>)
			}
			<Container className="create-project">
				<Row className="project-card-container">
						{
							projectObjects && projectObjects.map((project, index) => (
								<Col  className="mb-3" sm={6} md={4} lg={3} key={index}>
									<ProjectCard 
										project={project}
									/>
								</Col>
							))
						}
				</Row>

				<ProjectForm 
					title={projectTitle}
					text={projectText}
					url={projectUrl}
					image={projectImage}
					uploadProgress={uploadProgress}
					uploadedImageUrl={uploadedImageUrl}
					handleSaveOnClick={(e) => handleSaveOnClick(e)}
					handleImageChange={handleImageChange}
					handleTitleChange={(e) => setProjectTitle(e.target.value)}
					handleTextChange={(e) => setProjectText(e.target.value)}
					handleUrlChange={(e) => setProjectUrl(e.target.value)}
				/>
			</Container>
			
			<Container className="add-about-text mt-5">
						{isSaved && <Container className="about-container mb-3 pb-2">
							<h1  className="p-3" style={{ fontSize: "40px" }}>{currentUser.displayName}</h1>
							{
								aboutObjects && aboutObjects.map((section, index) => (
									<About key={index} section={section} />
								))
							}
						</Container>}

				<AboutForm 
					title={aboutTitle}
					text={aboutText}
					url={aboutUrl}
					handleSaveOnClick={(e) => handleSaveOnClick(e)}
					handleTextChange={(e) => setAboutText(e.target.value)}
					handleTitleChange={(e) => setAboutTitle(e.target.value)}
					handleUrlChange={(e) => setAboutUrl(e.target.value)}
				/>
			</Container>

			<Container className="add-links-form mt-5">
				<LinksForm 
					handleGithubChange={(e) => setGithubUrl(e.target.value)}
					handleLinkedinChange={(e) => setLinkedinUrl(e.target.value)}
					handleFacebookChange={(e) => setFacebookUrl(e.target.value)}
				/>
			</Container>
		</>
	 );
}
 
export default CreateForm;