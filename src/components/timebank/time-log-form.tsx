"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
// import { useRouter } from "next/navigation";

const timeLogFormSchema = z.object({
  transactionType: z.enum(["credit", "debit"], {
    required_error: "You need to select a transaction type.",
  }),
  participantName: z.string().min(2, { message: "Participant name is required." }),
  skillExchanged: z.string().min(3, { message: "Skill description is required." }),
  hours: z.coerce.number().positive({ message: "Hours must be a positive number." }),
  date: z.date({
    required_error: "A date for the exchange is required.",
  }),
  description: z.string().optional(),
});

type TimeLogFormValues = z.infer<typeof timeLogFormSchema>;

export function TimeLogForm() {
  // const router = useRouter();
  const form = useForm<TimeLogFormValues>({
    resolver: zodResolver(timeLogFormSchema),
    defaultValues: {
      transactionType: "credit",
      participantName: "",
      skillExchanged: "",
      hours: 1,
      date: new Date(),
      description: "",
    },
  });

  // TODO: Implement actual time logging logic
  function onSubmit(values: TimeLogFormValues) {
    console.log("Time log submitted", values);
    // API call to log time
    // router.refresh(); // or redirect, or show success message
    form.reset();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="transactionType"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Transaction Type*</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex space-x-4"
                >
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="credit" />
                    </FormControl>
                    <FormLabel className="font-normal">Time Credited (I GAVE help)</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="debit" />
                    </FormControl>
                    <FormLabel className="font-normal">Time Spent (I RECEIVED help)</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid md:grid-cols-2 gap-6">
            <FormField
            control={form.control}
            name="participantName"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Participant Name*</FormLabel>
                <FormControl>
                    <Input placeholder="e.g., Jane Doe" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />

            <FormField
            control={form.control}
            name="skillExchanged"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Skill Exchanged*</FormLabel>
                <FormControl>
                    <Input placeholder="e.g., Web design consultation" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
            <FormField
                control={form.control}
                name="hours"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Hours*</FormLabel>
                    <FormControl>
                        <Input type="number" step="0.5" min="0.5" placeholder="e.g., 2.5" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date of Exchange*</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add any notes about the exchange."
                  className="resize-y"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
          <Clock className="mr-2 h-4 w-4" /> Log Time
        </Button>
      </form>
    </Form>
  );
}
