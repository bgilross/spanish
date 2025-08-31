"use client"

import React from "react"
import { useDataStore } from "@/data/dataStore"

const Main = () => {
	const lessons = useDataStore((state) => state.lessons)

	return <div>Main</div>
}

export default Main
