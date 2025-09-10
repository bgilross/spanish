// Render the canonical MainPage component (includes persistence & logging)
import MainPage from "@/components/MainPage"
import FirstVisitModal from "@/components/FirstVisitModal" // added

export const metadata = {
	title: "Spanish Learner",
}

export default function Home() {
	return (
		<div>
			<MainPage />
			<FirstVisitModal /> {/* modal always mounts */}
		</div>
	)
}
