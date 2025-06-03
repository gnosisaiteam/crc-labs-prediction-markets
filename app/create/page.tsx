"use client"

import { useState } from "react"
import Link from "next/link"

interface CirclesGroup {
  address: string;
  name: string;
}

interface FormData {
  title: string;
  closingDate: string;
  outcomes: string[];
  initialFunds: string;
  feePercentage: string;
  circlesGroup: string;
}

export default function CreateMarket() {
  const circlesGroups: CirclesGroup[] = [
    { address: '0x86533d1ada8ffbe7b6f7244f9a1b707f7f3e239b', name: 'Metri Core Group' },
    // Add more groups here as needed
  ]

  const [formData, setFormData] = useState<FormData>({
    title: "",
    closingDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    outcomes: ["Yes", "No"],
    initialFunds: "1",
    feePercentage: "2.0",
    circlesGroup: '0x86533d1ada8ffbe7b6f7244f9a1b707f7f3e239b' // Default to Metri Core Group
  })
  const [newOutcome, setNewOutcome] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission here
    console.log({
      ...formData,
      initialFunds: parseFloat(formData.initialFunds),
      feePercentage: parseFloat(formData.feePercentage)
    })
  }

  const addOutcome = (e?: React.FormEvent) => {
    e?.preventDefault()
    const trimmedOutcome = newOutcome.trim()
    if (trimmedOutcome && !formData.outcomes.includes(trimmedOutcome)) {
      setFormData(prev => ({
        ...prev,
        outcomes: [...prev.outcomes, trimmedOutcome]
      }))
      setNewOutcome("")
    }
  }

  const removeOutcome = (outcomeToRemove: string, e: React.MouseEvent) => {
    e.preventDefault()
    if (formData.outcomes.length <= 2) return // Prevent removing if only two outcomes left
    setFormData(prev => ({
      ...prev,
      outcomes: prev.outcomes.filter(outcome => outcome !== outcomeToRemove)
    }))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    // For initialFunds, only allow positive integers
    if (name === 'initialFunds') {
      // Only update if it's a valid positive integer or empty string
      if (value === '' || /^\d+$/.test(value)) {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }))
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6">

      <h1 className="text-3xl font-bold mb-8">Create new market</h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Market Title
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                name="title"
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Will the event happen?"
                required
              />
            </div>

            <div>
              <label htmlFor="closingDate" className="block text-sm font-medium text-gray-700 mb-1">
                Closing Date
              </label>
              <input
                type="datetime-local"
                id="closingDate"
                value={formData.closingDate}
                name="closingDate"
                onChange={handleInputChange}
                defaultValue={new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Outcomes
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.outcomes.map((outcome) => (
                  <div key={outcome} className="flex items-center bg-gray-100 px-3 py-1 rounded-full">
                    <span className="mr-1">{outcome}</span>
                    {formData.outcomes.length > 2 && (
                      <button
                        type="button"
                        onClick={(e) => removeOutcome(outcome, e)}
                        className="text-gray-500 hover:text-red-500"
                        title="Remove outcome"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newOutcome}
                  onChange={(e) => setNewOutcome(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addOutcome(e)}
                  className="flex-1 px-3 py-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add new outcome"
                />
                <button
                  type="button"
                  onClick={addOutcome}
                  disabled={!newOutcome.trim()}
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">At least 2 outcomes required</p>
            </div>

            <div>
              <label htmlFor="circlesGroup" className="block text-sm font-medium text-gray-700 mb-1">
                Circles Group
              </label>
              <select
                id="circlesGroup"
                name="circlesGroup"
                value={formData.circlesGroup}
                onChange={handleInputChange}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              >
                {circlesGroups.map((group) => (
                  <option key={group.address} value={group.address}>
                    {group.name} ({group.address.slice(0, 6)}...{group.address.slice(-4)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="initialFunds" className="block text-sm font-medium text-gray-700 mb-1">
                Amount of CRC Tokens
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="initialFunds"
                  min="1"
                  step="1"
                  value={formData.initialFunds}
                  name="initialFunds"
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="1"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="feePercentage" className="block text-sm font-medium text-gray-700 mb-1">
                Fee Percentage
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="feePercentage"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.feePercentage}
                  name="feePercentage"
                  onChange={handleInputChange}
                  className="w-full pr-10 py-2 pl-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500">%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-200">
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={formData.outcomes.length < 2}
              className={`px-6 py-2 text-base font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${formData.outcomes.length < 2
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
                }`}
            >
              Create Market
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
